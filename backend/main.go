package main

import (
	"log"
	"os"
	"strings"
	"time"

	"invesa_backend/internal/database"
	"invesa_backend/internal/handlers"
	"invesa_backend/internal/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using defaults")
	}

	// Connect to database
	if err := database.Connect(); err != nil {
		utils.LogFatal("Failed to connect to database: %v", err)
	}
	defer database.DB.Close()

	// Create tables if they don't exist
	if err := database.CreateTables(); err != nil {
		utils.LogFatal("Failed to create tables: %v", err)
	}

	r := gin.Default()

	// CORS Setup
	allowedOrigins := []string{"http://localhost:5173", "http://localhost:5174", "http://localhost"}
	if origins := os.Getenv("ALLOWED_ORIGINS"); origins != "" {
		allowedOrigins = append(allowedOrigins, strings.Split(origins, ",")...)
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Routes
	api := r.Group("/api")
	{
		api.POST("/register", handlers.Register)
		api.POST("/login", handlers.Login)
		api.POST("/forgot-password", handlers.ForgotPassword)
		api.POST("/reset-password", handlers.ResetPassword)

		api.GET("/ideas", handlers.GetIdeas)
		api.POST("/ideas", handlers.CreateIdea)
		api.POST("/ideas/:id/like", handlers.LikeIdea)
		api.GET("/ideas/:id/comments", handlers.GetComments)
		api.POST("/ideas/:id/comments", handlers.CreateComment)

		api.POST("/messages", handlers.SendMessage)
		api.GET("/messages", handlers.GetMessages) // ?user1=1&user2=2

		api.GET("/matches", handlers.GetMatches)
		api.POST("/upgrade", handlers.UpgradeToPremium)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	ServerPort := ":" + port

	log.Printf("Server executing on port %s", ServerPort)
	if err := r.Run(ServerPort); err != nil {
		utils.LogFatal("Failed to run server: %v", err)
	}
}
