package handlers

import (
	"context"
	"invesa_backend/internal/database"
	"invesa_backend/internal/models"
	"invesa_backend/internal/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetMatches returns a list of potential matches for the user
func GetMatches(c *gin.Context) {
	// 1. Identify current user
	currentUserStr, exists := c.Get("user_id")
	if !exists {
		// Fallback for demo if middleware not strictly enforced
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}
	userID := currentUserStr.(int)

	// 2. Refresh user details (to check role and premium status)
	var user models.User
	err := database.DB.QueryRow(context.Background(), "SELECT id, role, is_premium FROM users WHERE id = $1", userID).Scan(&user.ID, &user.Role, &user.IsPremium)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to fetch user profile")
		return
	}

	// 3. Determine target role (Opposites attract)
	targetRole := "Investor"
	if user.Role == "Investor" {
		targetRole = "Entrepreneur"
	}

	// 4. Query Matches
	rows, err := database.DB.Query(context.Background(), "SELECT id, username, full_name, bio, role, created_at FROM users WHERE role = $1 AND id != $2 ORDER BY created_at DESC LIMIT 20", targetRole, userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to fetch matches")
		return
	}
	defer rows.Close()

	var matches []map[string]interface{}
	for rows.Next() {
		var m models.User
		if err := rows.Scan(&m.ID, &m.Username, &m.FullName, &m.Bio, &m.Role, &m.CreatedAt); err != nil {
			continue
		}

		matchData := map[string]interface{}{
			"id":   m.ID,
			"role": m.Role,
			"bio":  m.Bio, // Bio is always visible
		}

		// MONETIZATION LOGIC:
		// If premium, show everything.
		// If free, blur/hide identifying details.
		if user.IsPremium {
			matchData["username"] = m.Username
			matchData["full_name"] = m.FullName
			matchData["is_locked"] = false
		} else {
			matchData["username"] = "Hidden User"
			matchData["full_name"] = "Premium Member" // Placeholder
			matchData["is_locked"] = true
		}

		matches = append(matches, matchData)
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{
		"is_premium": user.IsPremium,
		"matches":    matches,
		"role":       user.Role,
	})
}

// UpgradeToPremium simulates a payment and upgrades the user
func UpgradeToPremium(c *gin.Context) {
	// In a real app, this would verify a Stripe Webhook
	currentUserStr, exists := c.Get("user_id")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}
	userID := currentUserStr.(int)

	_, err := database.DB.Exec(context.Background(), "UPDATE users SET is_premium = TRUE WHERE id = $1", userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to upgrade subscription")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Welcome to Premium! Matches unlocked."})
}
