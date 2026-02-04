package handlers

import (
	"context"
	"invesa_backend/internal/database"
	"invesa_backend/internal/utils"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func ForgotPassword(c *gin.Context) {
	var input struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Verify user exists
	var userID int
	err := database.DB.QueryRow(context.Background(), "SELECT id FROM users WHERE email = $1", input.Email).Scan(&userID)
	if err != nil {
		// Verify vague response specifically to prevent email enumeration, or decided to be helpful?
		// For MVP, being helpful is fine, but standard practice is "If email exists..."
		// Let's just return success to avoid leaking users, but log it.
		// ACTUALLY, implemented checking to log the mock link correctly.
		utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "If an account exists with this email, a reset link has been sent."})
		return
	}

	// Generate Token
	token := uuid.New().String()
	expiresAt := time.Now().Add(1 * time.Hour) // 1 hour expiry

	// store token
	_, err = database.DB.Exec(context.Background(), "INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)", userID, token, expiresAt)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to process request")
		return
	}

	// Send Email
	go utils.SendResetEmail(input.Email, token)

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "If an account exists with this email, a reset link has been sent."})
}

func ResetPassword(c *gin.Context) {
	var input struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := utils.ValidatePassword(input.NewPassword); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Verify Token
	var userID int
	var expiresAt time.Time
	err := database.DB.QueryRow(context.Background(), "SELECT user_id, expires_at FROM password_resets WHERE token = $1", input.Token).Scan(&userID, &expiresAt)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid or expired token")
		return
	}

	if time.Now().After(expiresAt) {
		utils.RespondWithError(c, http.StatusBadRequest, "Token verified but expired")
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	// Update User Password
	_, err = database.DB.Exec(context.Background(), "UPDATE users SET password = $1 WHERE id = $2", string(hashedPassword), userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update password")
		return
	}

	// Delete used tokens for this user (invalidate all)
	_, _ = database.DB.Exec(context.Background(), "DELETE FROM password_resets WHERE user_id = $1", userID)

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Password reset successfully"})
}
