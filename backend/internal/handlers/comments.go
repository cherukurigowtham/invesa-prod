package handlers

import (
	"invesa_backend/internal/database"
	"invesa_backend/internal/models"
	"invesa_backend/internal/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateComment(c *gin.Context) {
	ideaID := c.Param("id")
	var comment models.Comment
	if err := c.ShouldBindJSON(&comment); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	_, err := database.DB.Exec(c, "INSERT INTO comments (idea_id, user_id, content) VALUES ($1, $2, $3)", ideaID, comment.UserID, comment.Content)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to post comment")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Comment posted successfully"})
}

func GetComments(c *gin.Context) {
	ideaID := c.Param("id")

	rows, err := database.DB.Query(c, `
		SELECT c.id, c.idea_id, c.user_id, u.username, c.content, c.created_at 
		FROM comments c 
		JOIN users u ON c.user_id = u.id 
		WHERE c.idea_id = $1 
		ORDER BY c.created_at ASC`, ideaID)

	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to fetch comments")
		return
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var cm models.Comment
		if err := rows.Scan(&cm.ID, &cm.IdeaID, &cm.UserID, &cm.Username, &cm.Content, &cm.CreatedAt); err != nil {
			continue
		}
		comments = append(comments, cm)
	}

	utils.RespondWithJSON(c, http.StatusOK, comments)
}
