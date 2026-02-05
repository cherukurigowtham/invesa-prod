package handlers

import (
	"invesa_backend/internal/database"
	"invesa_backend/internal/utils"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type FeedbackRequest struct {
	Email   string `json:"email"`
	Message string `json:"message" binding:"required"`
}

func SubmitFeedback(c *gin.Context) {
	var input FeedbackRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Message is required")
		return
	}

	_, err := database.DB.Exec(c,
		"INSERT INTO feedback (email, message, created_at) VALUES ($1, $2, $3)",
		input.Email, input.Message, time.Now(),
	)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to submit feedback")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Thanks for the feedback"})
}
