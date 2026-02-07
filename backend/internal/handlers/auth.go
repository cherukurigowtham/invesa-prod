package handlers

import (
	"context"
	"invesa_backend/internal/database"
	"invesa_backend/internal/models"
	"invesa_backend/internal/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

// SyncProfile ensures the user exists in our local database after Supabase Login
func SyncProfile(c *gin.Context) {
	var input struct {
		Email    string `json:"email"`
		Username string `json:"username"`
		FullName string `json:"full_name"`
		Avatar   string `json:"avatar_url"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}
	uidStr := userID.(string)

	var user models.User
	// Check if user exists
	err := database.DB.QueryRow(context.Background(), "SELECT id, username, email, role FROM users WHERE id = $1", uidStr).Scan(
		&user.ID, &user.Username, &user.Email, &user.Role)

	if err == nil {
		// User exists, return it
		utils.RespondWithJSON(c, http.StatusOK, gin.H{
			"message": "User synced",
			"user":    user,
		})
		return
	}

	// User does not exist, create profile
	// If username not provided (e.g. from Google), generate one or use email suffix
	if input.Username == "" {
		input.Username = input.Email // fallback
	}

	// Handle Conflict if username exists (rare but possible if manually picked)
	// For simplicity, we assume frontend handles uniqueness or we let it fail.

	_, err = database.DB.Exec(context.Background(),
		"INSERT INTO users (id, username, email, full_name, role) VALUES ($1, $2, $3, $4, 'Entrepreneur')",
		uidStr, input.Username, input.Email, input.FullName)

	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create profile: "+err.Error())
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{
		"message": "Profile created",
		"user": gin.H{
			"id":        uidStr,
			"username":  input.Username,
			"email":     input.Email,
			"full_name": input.FullName,
			"role":      "Entrepreneur",
		},
	})
}

// UpdateProfile allows a logged-in user to update their profile details
func UpdateProfile(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required,min=3,max=30"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}
	uidStr := userID.(string)

	// Update username in database
	_, err := database.DB.Exec(context.Background(), "UPDATE users SET username = $1 WHERE id = $2", input.Username, uidStr)
	if err != nil {
		// specific check for unique violation would be better, but generic error for now
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update profile: "+err.Error())
		return
	}

	// Fetch updated user to return consistent data
	var user models.User
	err = database.DB.QueryRow(context.Background(), "SELECT id, username, email, role, full_name, avatar_url, bio FROM users WHERE id = $1", uidStr).Scan(
		&user.ID, &user.Username, &user.Email, &user.Role, &user.FullName, &user.AvatarURL, &user.Bio)

	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to fetch updated profile")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user":    user,
	})
}
