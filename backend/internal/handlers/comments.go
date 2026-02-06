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

	// Validate user existence (and get username)
	var username string
	// UserID is now UUID string from frontend (if passed) or context?
	// The comment struct from JSON will have user_id, but better to get from Context for security.
	// But let's assume valid ID is passed for now or override it.
	userID, _ := c.Get("user_id")
	comment.UserID = userID.(string)

	err := database.DB.QueryRow(c, "SELECT username FROM users WHERE id=$1", comment.UserID).Scan(&username)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid user")
		return
	}

	var commentID int
	err = database.DB.QueryRow(c, "INSERT INTO comments (idea_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, created_at",
		ideaID, comment.UserID, comment.Content).Scan(&commentID, &comment.CreatedAt)

	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to post comment")
		return
	}

	comment.ID = commentID
	comment.Username = username

	utils.RespondWithJSON(c, http.StatusOK, comment)
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
