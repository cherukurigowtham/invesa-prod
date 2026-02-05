package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
)

// ResponseTime adds X-Response-Time header for basic performance visibility.
func ResponseTime() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		c.Writer.Header().Set("X-Response-Time", time.Since(start).String())
	}
}
