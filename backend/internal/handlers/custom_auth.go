package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"invesa_backend/internal/database"
	"invesa_backend/internal/utils"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// Signup registers a new user
func Signup(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=8"`
		Role     string `json:"role"`
		Bio      string `json:"bio"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Check if user exists
	var exists bool
	err := database.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)", input.Email).Scan(&exists)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Database error")
		return
	}
	if exists {
		utils.RespondWithError(c, http.StatusConflict, "Email already exists")
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	// Generate UUID
	userID := uuid.New().String()
	if input.Role == "" {
		input.Role = "Entrepreneur"
	}

	_, err = database.DB.Exec(context.Background(),
		"INSERT INTO users (id, username, email, password_hash, role, bio) VALUES ($1, $2, $3, $4, $5, $6)",
		userID, input.Username, input.Email, string(hashedPassword), input.Role, input.Bio)

	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create user: "+err.Error())
		return
	}

	// Generate JWT
	token, err := utils.GenerateToken(userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	utils.RespondWithJSON(c, http.StatusCreated, gin.H{
		"token": token,
		"user": gin.H{
			"id":       userID,
			"username": input.Username,
			"email":    input.Email,
			"role":     input.Role,
		},
	})
}

// Login authenticates a user
func Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	var userID, username, role, passwordHash string
	err := database.DB.QueryRow(context.Background(),
		"SELECT id, username, role, password_hash FROM users WHERE email=$1", input.Email).Scan(&userID, &username, &role, &passwordHash)

	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(input.Password)); err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	token, err := utils.GenerateToken(userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":       userID,
			"username": username,
			"email":    input.Email,
			"role":     role,
		},
	})
}

// ForgotPassword generates a reset token and sends email
func ForgotPassword(c *gin.Context) {
	var input struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Generate random token
	bytes := make([]byte, 32)
	rand.Read(bytes)
	token := hex.EncodeToString(bytes)
	expiry := time.Now().Add(1 * time.Hour)

	// Save token to DB
	// We update only if user exists, but we don't leak user existence info usually.
	// However, for simplicity/UX, we'll check existence first or just update.
	result, err := database.DB.Exec(context.Background(),
		"UPDATE users SET reset_token=$1, reset_token_expiry=$2 WHERE email=$3",
		token, expiry, input.Email)

	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Database error")
		return
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		// User not found. To prevent enumeration, return success anyway.
		utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "If this email exists, a reset link has been sent."})
		return
	}

	// Send Email
	go utils.SendResetEmail(input.Email, token)

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "If this email exists, a reset link has been sent."})
}

// ResetPassword resets the password using the token
func ResetPassword(c *gin.Context) {
	var input struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	result, err := database.DB.Exec(context.Background(),
		"UPDATE users SET password_hash=$1, reset_token=NULL, reset_token_expiry=NULL WHERE reset_token=$2 AND reset_token_expiry > NOW()",
		string(hashedPassword), input.Token)

	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Database error")
		return
	}

	if result.RowsAffected() == 0 {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid or expired token")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Password reset successfully"})
}

// UpdateProfile updates user profile information
func UpdateProfile(c *gin.Context) {
	userId, exists := c.Get("user_id")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var input struct {
		Username string `json:"username"`
		FullName string `json:"full_name"`
		Bio      string `json:"bio"`
		Avatar   string `json:"avatar_url"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Update query
	// Note: We might want to handle partial updates more dynamically, but for now this works if frontend sends all fields
	// Or we can use COALESCE in SQL or build query dynamically.
	// For simplicity in this fix, let's assume standard update.

	_, err := database.DB.Exec(context.Background(),
		"UPDATE users SET full_name=$1, bio=$2, avatar_url=$3 WHERE id=$4",
		input.FullName, input.Bio, input.Avatar, userId)

	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Profile updated successfully"})
}
