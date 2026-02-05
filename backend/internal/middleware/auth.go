package middleware

import (
	"net/http"
	"strings"

	"invesa_backend/internal/utils"

	"github.com/gin-gonic/gin"
)

// RequireAuth validates JWT (Authorization: Bearer <token>) and sets user_id in context.
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			userID, err := utils.ParseJWT(tokenStr)
			if err == nil && userID > 0 {
				c.Set("user_id", userID)
				c.Next()
				return
			}
		}

		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		c.Abort()
	}
}
