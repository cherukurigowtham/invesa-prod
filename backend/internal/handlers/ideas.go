package handlers

import (
	"fmt"
	"invesa_backend/internal/database"
	"invesa_backend/internal/models"
	"invesa_backend/internal/utils"
	"net/http"
	"sync"
	"time"

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

	clearIdeasCache()

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Idea posted successfully"})
}

func GetIdeas(c *gin.Context) {
	category := c.Query("category")
	search := c.Query("search")
	userID := c.Query("user_id")
	limit := parseLimit(c.Query("limit"), 20, 100)
	offset := parseOffset(c.Query("offset"))

	cacheKey := ideasCacheKey(category, search, userID, limit, offset)
	if search == "" && userID == "" {
		if cached, ok := getIdeasCache(cacheKey); ok {
			utils.RespondWithJSON(c, http.StatusOK, cached)
			return
		}
	}

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

	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argId, argId+1)
	args = append(args, limit, offset)

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

	response := IdeasResponse{
		Items:  ideas,
		Limit:  limit,
		Offset: offset,
	}

	if search == "" && userID == "" {
		setIdeasCache(cacheKey, response)
	}

	utils.RespondWithJSON(c, http.StatusOK, response)
}

type LikeRequest struct {
	UserID string `json:"user_id"` // UUID
}

type IdeasResponse struct {
	Items  []models.Idea `json:"items"`
	Limit  int           `json:"limit"`
	Offset int           `json:"offset"`
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

	clearIdeasCache()

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Success", "liked": !exists})
}

type ideasCacheEntry struct {
	value     IdeasResponse
	expiresAt time.Time
}

var (
	ideasCacheMu sync.Mutex
	ideasCache   = map[string]ideasCacheEntry{}
)

const ideasCacheTTL = 10 * time.Second

func ideasCacheKey(category, search, userID string, limit, offset int) string {
	return fmt.Sprintf("category=%s|search=%s|user=%s|limit=%d|offset=%d", category, search, userID, limit, offset)
}

func getIdeasCache(key string) (IdeasResponse, bool) {
	ideasCacheMu.Lock()
	defer ideasCacheMu.Unlock()

	entry, ok := ideasCache[key]
	if !ok {
		return IdeasResponse{}, false
	}
	if time.Now().After(entry.expiresAt) {
		delete(ideasCache, key)
		return IdeasResponse{}, false
	}
	return entry.value, true
}

func setIdeasCache(key string, value IdeasResponse) {
	ideasCacheMu.Lock()
	defer ideasCacheMu.Unlock()
	ideasCache[key] = ideasCacheEntry{
		value:     value,
		expiresAt: time.Now().Add(ideasCacheTTL),
	}
}

func clearIdeasCache() {
	ideasCacheMu.Lock()
	defer ideasCacheMu.Unlock()
	ideasCache = map[string]ideasCacheEntry{}
}
func DeleteIdea(c *gin.Context) {
	ideaID := c.Param("id")
	userID, exists := c.Get("user_id")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Verify ownership
	var ownerID string
	err := database.DB.QueryRow(c, "SELECT user_id FROM ideas WHERE id=$1", ideaID).Scan(&ownerID)
	if err != nil {
		utils.RespondWithError(c, http.StatusNotFound, "Idea not found")
		return
	}

	if ownerID != userID.(string) {
		utils.RespondWithError(c, http.StatusForbidden, "You can only delete your own ideas")
		return
	}

	// Delete
	_, err = database.DB.Exec(c, "DELETE FROM ideas WHERE id=$1", ideaID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to delete idea")
		return
	}

	// Log activity
	utils.LogActivity(c, userID.(string), "DELETE_IDEA", "Deleted idea "+ideaID)

	clearIdeasCache()

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Idea deleted successfully"})
}
