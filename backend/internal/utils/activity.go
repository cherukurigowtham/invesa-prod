package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"invesa_backend/internal/database"

	"github.com/gin-gonic/gin"
)

// LogActivity records a user action in the database
func LogActivity(c *gin.Context, userID, action string, details interface{}) {
	// Serialize details to JSON if it's not a string
	var detailsStr string
	if s, ok := details.(string); ok {
		detailsStr = s
	} else {
		b, err := json.Marshal(details)
		if err == nil {
			detailsStr = string(b)
		}
	}

	ip := c.ClientIP()

	// Run in background so it doesn't block the request
	go func() {
		// Use a fresh context for background DB operation
		// (c.Request.Context() might be cancelled when request ends)
		ctx := context.Background()
		_, err := database.DB.Exec(ctx,
			"INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)",
			userID, action, detailsStr, ip)

		if err != nil {
			// In a real app, use a proper logger
			fmt.Printf("Failed to log activity: %v\n", err)
		}
	}()
}
