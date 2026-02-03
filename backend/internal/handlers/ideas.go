package handlers

import (
	"fmt"
	"invesa_backend/internal/database"
	"invesa_backend/internal/models"
	"invesa_backend/internal/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateIdea(c *gin.Context) {
	var idea models.Idea
	if err := c.ShouldBindJSON(&idea); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Default category if empty
	if idea.Category == "" {
		idea.Category = "Other"
	}

	_, err := database.DB.Exec(c, "INSERT INTO ideas (user_id, title, description, category) VALUES ($1, $2, $3, $4)", idea.UserID, idea.Title, idea.Description, idea.Category)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create idea")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Idea posted successfully"})
}

func GetIdeas(c *gin.Context) {
	category := c.Query("category")
	search := c.Query("search")
	userID := c.Query("user_id")

	query := "SELECT id, user_id, title, description, category, created_at, (SELECT COUNT(*) FROM idea_likes WHERE idea_id = ideas.id) as likes_count FROM ideas WHERE 1=1"
	args := []interface{}{}
	argId := 1

	if category != "" && category != "All" {
		query += fmt.Sprintf(" AND category = $%d", argId)
		args = append(args, category)
		argId++
	}

	if search != "" {
		query += fmt.Sprintf(" AND (title ILIKE $%d OR description ILIKE $%d)", argId, argId)
		args = append(args, "%"+search+"%")
		argId++
	}

	if userID != "" {
		query += fmt.Sprintf(" AND user_id = $%d", argId)
		args = append(args, userID)
		argId++
	}

	query += " ORDER BY created_at DESC"

	rows, err := database.DB.Query(c, query, args...)
	if err != nil {
		fmt.Printf("Query error: %v\n", err)
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to fetch ideas")
		return
	}
	defer rows.Close()

	var ideas []models.Idea
	for rows.Next() {
		var i models.Idea
		if err := rows.Scan(&i.ID, &i.UserID, &i.Title, &i.Description, &i.Category, &i.CreatedAt, &i.LikesCount); err != nil {
			fmt.Printf("Scan error: %v\n", err)
			continue
		}
		ideas = append(ideas, i)
	}

	utils.RespondWithJSON(c, http.StatusOK, ideas)
}

type LikeRequest struct {
	UserID int `json:"user_id"`
}

func LikeIdea(c *gin.Context) {
	ideaID := c.Param("id")
	var req LikeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request")
		return
	}

	// Check if already liked
	var exists bool
	err := database.DB.QueryRow(c, "SELECT EXISTS(SELECT 1 FROM idea_likes WHERE user_id=$1 AND idea_id=$2)", req.UserID, ideaID).Scan(&exists)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Database error")
		return
	}

	if exists {
		// Unlike
		_, err = database.DB.Exec(c, "DELETE FROM idea_likes WHERE user_id=$1 AND idea_id=$2", req.UserID, ideaID)
	} else {
		// Like
		_, err = database.DB.Exec(c, "INSERT INTO idea_likes (user_id, idea_id) VALUES ($1, $2)", req.UserID, ideaID)
	}

	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update like")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Success", "liked": !exists})
}
