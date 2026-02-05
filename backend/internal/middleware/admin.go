package middleware

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

// RequireAdmin enforces a simple admin key for MVP admin endpoints.
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		adminKey := os.Getenv("ADMIN_KEY")
		if adminKey == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Admin key not configured"})
			c.Abort()
			return
		}

		if c.GetHeader("X-Admin-Key") != adminKey {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}
		c.Next()
	}
}
