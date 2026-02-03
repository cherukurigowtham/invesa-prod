package handlers

import (
	"fmt"
	"invesa_backend/internal/database"
	"invesa_backend/internal/models"
	"invesa_backend/internal/utils"
	"net/http"

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

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "User registered successfully", "user_id": userID})
}

func Login(c *gin.Context) {
	var input models.User
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	err := database.DB.QueryRow(c, "SELECT id, username, password FROM users WHERE username = $1", input.Username).Scan(&user.ID, &user.Username, &user.Password)
	if err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		utils.RespondWithError(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Login successful", "user": map[string]interface{}{"id": user.ID, "username": user.Username}})
}
