package handlers

import (
	"invesa_backend/internal/database"
	"invesa_backend/internal/models"
	"invesa_backend/internal/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

func SendMessage(c *gin.Context) {
	var msg models.Message
	if err := c.ShouldBindJSON(&msg); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	_, err := database.DB.Exec(c, "INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)", msg.SenderID, msg.ReceiverID, msg.Content)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to send message")
		return
	}

	// Log activity
	utils.LogActivity(c, msg.SenderID, "SEND_MESSAGE", "Sent a message to "+msg.ReceiverID)

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Message sent"})
}

func GetMessages(c *gin.Context) {
	user1 := c.Query("user1")
	user2 := c.Query("user2")
	limit := parseLimit(c.Query("limit"), 50, 200)
	offset := parseOffset(c.Query("offset"))

	if user1 == "" || user2 == "" {
		utils.RespondWithError(c, http.StatusBadRequest, "Missing user1 or user2")
		return
	}

	rows, err := database.DB.Query(c, `
		SELECT id, sender_id, receiver_id, content, created_at 
		FROM messages 
		WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
		ORDER BY created_at ASC
		LIMIT $3 OFFSET $4`, user1, user2, limit, offset)

	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to fetch messages")
		return
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var m models.Message
		if err := rows.Scan(&m.ID, &m.SenderID, &m.ReceiverID, &m.Content, &m.CreatedAt); err != nil {
			continue
		}
		messages = append(messages, m)
	}

	utils.RespondWithJSON(c, http.StatusOK, MessagesResponse{
		Items:  messages,
		Limit:  limit,
		Offset: offset,
	})
}

type MessagesResponse struct {
	Items  []models.Message `json:"items"`
	Limit  int              `json:"limit"`
	Offset int              `json:"offset"`
}
