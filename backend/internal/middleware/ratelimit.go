package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type rateLimiter struct {
	mu        sync.Mutex
	clients   map[string]*clientState
	limit     int
	window    time.Duration
	cleanup   time.Duration
	lastSweep time.Time
}

type clientState struct {
	count     int
	windowEnd time.Time
	lastSeen  time.Time
}

func NewRateLimiter(limit int, window, cleanup time.Duration) *rateLimiter {
	return &rateLimiter{
		clients:   make(map[string]*clientState),
		limit:     limit,
		window:    window,
		cleanup:   cleanup,
		lastSweep: time.Now(),
	}
}

func (rl *rateLimiter) Allow(ip string) bool {
	now := time.Now()

	rl.mu.Lock()
	defer rl.mu.Unlock()

	state, exists := rl.clients[ip]
	if !exists || now.After(state.windowEnd) {
		rl.clients[ip] = &clientState{
			count:     1,
			windowEnd: now.Add(rl.window),
			lastSeen:  now,
		}
		rl.sweepIfNeeded(now)
		return true
	}

	state.lastSeen = now
	if state.count >= rl.limit {
		rl.sweepIfNeeded(now)
		return false
	}
	state.count++
	rl.sweepIfNeeded(now)
	return true
}

func (rl *rateLimiter) sweepIfNeeded(now time.Time) {
	if now.Sub(rl.lastSweep) < rl.cleanup {
		return
	}

	for ip, state := range rl.clients {
		if now.Sub(state.lastSeen) > rl.cleanup {
			delete(rl.clients, ip)
		}
	}
	rl.lastSweep = now
}

func RateLimit(limit int, window, cleanup time.Duration) gin.HandlerFunc {
	rl := NewRateLimiter(limit, window, cleanup)
	return func(c *gin.Context) {
		ip := c.ClientIP()
		if !rl.Allow(ip) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded"})
			c.Abort()
			return
		}
		c.Next()
	}
}
