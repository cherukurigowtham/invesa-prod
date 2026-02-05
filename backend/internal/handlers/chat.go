package handlers

import (
	"invesa_backend/internal/database"
	"invesa_backend/internal/models"
	"invesa_backend/internal/utils"
	"net/http"
	"strconv"

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

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Message sent"})
}

func GetMessages(c *gin.Context) {
	user1Str := c.Query("user1")
	user2Str := c.Query("user2")
	limit := parseLimit(c.Query("limit"))
	offset := parseOffset(c.Query("offset"))

	user1, _ := strconv.Atoi(user1Str)
	user2, _ := strconv.Atoi(user2Str)

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

	utils.RespondWithJSON(c, http.StatusOK, messages)
}

func parseLimit(value string) int {
	const (
		defaultLimit = 50
		maxLimit     = 200
	)
	if value == "" {
		return defaultLimit
	}
	limit, err := strconv.Atoi(value)
	if err != nil || limit <= 0 {
		return defaultLimit
	}
	if limit > maxLimit {
		return maxLimit
	}
	return limit
}

func parseOffset(value string) int {
	if value == "" {
		return 0
	}
	offset, err := strconv.Atoi(value)
	if err != nil || offset < 0 {
		return 0
	}
	return offset
}
