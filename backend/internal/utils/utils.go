package utils

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
)

// RespondWithError creates a standardized JSON error response
func RespondWithError(c *gin.Context, code int, message string) {
	if requestID, ok := c.Get("request_id"); ok {
		c.JSON(code, gin.H{"error": message, "request_id": requestID})
		return
	}
	c.JSON(code, gin.H{"error": message})
}

// RespondWithJSON creates a standardized JSON success response
func RespondWithJSON(c *gin.Context, code int, payload interface{}) {
	c.JSON(code, payload)
}

// ValidatePassword checks if the password meets security requirements
// Min 8 chars, at least one number, one uppercase, and one special char
func ValidatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}

	hasNumber := false
	hasUpper := false
	hasSpecial := false

	for _, char := range password {
		if char >= '0' && char <= '9' {
			hasNumber = true
		} else if char >= 'A' && char <= 'Z' {
			hasUpper = true
		} else if (char >= '!' && char <= '/') || (char >= ':' && char <= '@') || (char >= '[' && char <= '`') || (char >= '{' && char <= '~') {
			hasSpecial = true
		}
	}

	if !hasNumber {
		return fmt.Errorf("password must contain at least one number")
	}
	if !hasUpper {
		return fmt.Errorf("password must contain at least one uppercase letter")
	}
	if !hasSpecial {
		return fmt.Errorf("password must contain at least one special character")
	}

	return nil
}

// LogFatal logs an error and exits, wrapper for log.Fatalf
func LogFatal(format string, v ...interface{}) {
	log.Fatalf(format, v...)
}
