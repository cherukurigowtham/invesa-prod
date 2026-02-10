package middleware

import (
	"github.com/gin-gonic/gin"
)

func CacheControl() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Only cache GET requests
		if c.Request.Method == "GET" {
			// Cache public data for 1 minute, allow validation
			c.Header("Cache-Control", "public, max-age=60, stale-while-revalidate=30")
		} else {
			// Do not cache mutations
			c.Header("Cache-Control", "no-store")
		}
		c.Next()
	}
}
