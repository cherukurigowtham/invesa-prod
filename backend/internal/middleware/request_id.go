package middleware

import (
	"crypto/rand"
	"encoding/hex"

	"github.com/gin-gonic/gin"
)

// RequestID attaches a request id to each request and response header.
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-Id")
		if requestID == "" {
			buf := make([]byte, 16)
			if _, err := rand.Read(buf); err == nil {
				requestID = hex.EncodeToString(buf)
			}
		}
		if requestID != "" {
			c.Writer.Header().Set("X-Request-Id", requestID)
			c.Set("request_id", requestID)
		}
		c.Next()
	}
}
