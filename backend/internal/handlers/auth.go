package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"invesa_backend/internal/database"
	"invesa_backend/internal/models"
	"invesa_backend/internal/utils"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func Register(c *gin.Context) {
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := utils.ValidatePassword(user.Password); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	var userID int
	err = database.DB.QueryRow(c, "INSERT INTO users (username, password, full_name, email, bio, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
		user.Username, string(hashedPassword), user.FullName, user.Email, user.Bio, user.Role).Scan(&userID)
	if err != nil {
		fmt.Printf("Registration error: %v\n", err)
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to register user (username or email might be taken)")
		return
	}

	token, _ := utils.GenerateJWT(userID)

	utils.RespondWithJSON(c, http.StatusOK, gin.H{
		"message": "User registered successfully",
		"user": map[string]interface{}{
			"id":         userID,
			"username":   user.Username,
			"full_name":  user.FullName,
			"email":      user.Email,
			"bio":        user.Bio,
			"role":       user.Role,
			"is_premium": false,
		},
		"token": token,
	})
}

func Login(c *gin.Context) {
	var input models.User
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	err := database.DB.QueryRow(c, "SELECT id, username, password, full_name, email, role, bio, is_premium FROM users WHERE username = $1",
		input.Username).Scan(&user.ID, &user.Username, &user.Password, &user.FullName, &user.Email, &user.Role, &user.Bio, &user.IsPremium)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	token, _ := utils.GenerateJWT(user.ID)

	utils.RespondWithJSON(c, http.StatusOK, gin.H{
		"message": "Login successful",
		"user": map[string]interface{}{
			"id":         user.ID,
			"username":   user.Username,
			"full_name":  user.FullName,
			"email":      user.Email,
			"bio":        user.Bio,
			"role":       user.Role,
			"is_premium": user.IsPremium,
		},
		"token": token,
	})
}

// InitiateRegistration sends a magic link to the user's email
func InitiateRegistration(c *gin.Context) {
	var input struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Valid email is required")
		return
	}

	// Check if email already exists
	var existingID int
	err := database.DB.QueryRow(c, "SELECT id FROM users WHERE email = $1", input.Email).Scan(&existingID)
	if err == nil {
		utils.RespondWithError(c, http.StatusConflict, "An account with this email already exists. Please login instead.")
		return
	}

	// Generate secure token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to generate token")
		return
	}
	token := hex.EncodeToString(tokenBytes)
	expiresAt := time.Now().Add(24 * time.Hour)

	// Delete any existing tokens for this email and insert new one
	_, _ = database.DB.Exec(c, "DELETE FROM registration_tokens WHERE email = $1", input.Email)
	_, err = database.DB.Exec(c, "INSERT INTO registration_tokens (email, token, expires_at) VALUES ($1, $2, $3)",
		input.Email, token, expiresAt)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create registration token")
		return
	}

	// Send email
	if err := utils.SendRegistrationEmail(input.Email, token); err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to send email. Please try again.")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Check your email for a link to complete registration"})
}

// CompleteRegistration validates token and creates the user account
func CompleteRegistration(c *gin.Context) {
	var input struct {
		Token    string `json:"token" binding:"required"`
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
		FullName string `json:"full_name" binding:"required"`
		Role     string `json:"role" binding:"required"`
		Bio      string `json:"bio"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "All fields are required")
		return
	}

	// Validate token and get email
	var email string
	var expiresAt time.Time
	err := database.DB.QueryRow(c, "SELECT email, expires_at FROM registration_tokens WHERE token = $1", input.Token).Scan(&email, &expiresAt)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid or expired registration link")
		return
	}

	if time.Now().After(expiresAt) {
		// Delete expired token
		_, _ = database.DB.Exec(c, "DELETE FROM registration_tokens WHERE token = $1", input.Token)
		utils.RespondWithError(c, http.StatusBadRequest, "Registration link has expired. Please request a new one.")
		return
	}

	// Validate password strength
	if err := utils.ValidatePassword(input.Password); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	// Create user
	var userID int
	err = database.DB.QueryRow(c, "INSERT INTO users (username, password, full_name, email, bio, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
		input.Username, string(hashedPassword), input.FullName, email, input.Bio, input.Role).Scan(&userID)
	if err != nil {
		fmt.Printf("Registration error: %v\n", err)
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create account (username might be taken)")
		return
	}

	// Delete used token
	_, _ = database.DB.Exec(c, "DELETE FROM registration_tokens WHERE token = $1", input.Token)

	token, _ := utils.GenerateJWT(userID)

	// Return success with user info for auto-login
	utils.RespondWithJSON(c, http.StatusOK, gin.H{
		"message": "Account created successfully",
		"user": map[string]interface{}{
			"id":         userID,
			"username":   input.Username,
			"full_name":  input.FullName,
			"email":      email,
			"bio":        input.Bio,
			"role":       input.Role,
			"is_premium": false,
		},
		"token": token,
	})
}

// ValidateRegistrationToken checks if a token is valid and returns the email
func ValidateRegistrationToken(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		utils.RespondWithError(c, http.StatusBadRequest, "Token is required")
		return
	}

	var email string
	var expiresAt time.Time
	err := database.DB.QueryRow(c, "SELECT email, expires_at FROM registration_tokens WHERE token = $1", token).Scan(&email, &expiresAt)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid registration link")
		return
	}

	if time.Now().After(expiresAt) {
		utils.RespondWithError(c, http.StatusBadRequest, "Registration link has expired")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"email": email})
}
