package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"invesa_backend/internal/database"
	"invesa_backend/internal/handlers"
	"invesa_backend/internal/middleware"
	"invesa_backend/internal/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
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

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		requestID, _ := param.Keys["request_id"].(string)
		return fmt.Sprintf(`{"time":"%s","status":%d,"method":"%s","path":"%s","latency":"%s","ip":"%s","request_id":"%s"}`+"\n",
			param.TimeStamp.Format(time.RFC3339),
			param.StatusCode,
			param.Method,
			param.Path,
			param.Latency,
			param.ClientIP,
			requestID,
		)
	}))
	r.Use(middleware.RequestID())
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.ResponseTime())

	rateLimitWindow := 1 * time.Minute
	rateLimitCleanup := 5 * time.Minute
	r.Use(middleware.RateLimit(120, rateLimitWindow, rateLimitCleanup))
	r.Use(gzip.Gzip(gzip.DefaultCompression))
	r.Use(middleware.CacheControl())

	// CORS Setup
	allowedOrigins := []string{
		"http://localhost:5173",
		"http://localhost:5174",
		"http://localhost",
		"https://invesa-prod-he47.vercel.app",
	}
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
		api.GET("/health", func(c *gin.Context) {
			utils.RespondWithJSON(c, http.StatusOK, gin.H{"status": "ok"})
		})

		// Auth Routes (Custom Neon Auth)
		auth := api.Group("/auth")
		{
			auth.POST("/signup", handlers.Signup)
			auth.POST("/login", handlers.Login)
			auth.POST("/logout", middleware.RequireAuth(), handlers.Logout) // Added Logout
			auth.POST("/forgot-password", handlers.ForgotPassword)
			auth.POST("/reset-password", handlers.ResetPassword)
		}

		// User Profile Routes
		api.PUT("/profile", middleware.RequireAuth(), handlers.UpdateProfile)

		// Legacy routes removed (Supabase handles them)
		// handlers.Register, Login, etc are deleted.

		api.POST("/feedback", handlers.SubmitFeedback)

		api.GET("/ideas", handlers.GetIdeas)
		api.POST("/ideas", handlers.CreateIdea)
		api.DELETE("/ideas/:id", middleware.RequireAuth(), handlers.DeleteIdea)
		api.POST("/ideas/:id/like", handlers.LikeIdea)

		api.POST("/messages", handlers.SendMessage)
		api.GET("/messages", handlers.GetMessages) // ?user1=1&user2=2

		// protected := api.Group("/", middleware.RequireAuth())
		// {
		// 	// Matches removed
		// }
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
		log.Println("WARNING: PORT environment variable not found, defaulting to 8080")
	} else {
		log.Printf("INFO: PORT environment variable found: %s", port)
	}
	ServerPort := ":" + port

	srv := &http.Server{
		Addr:              ServerPort,
		Handler:           r,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		log.Printf("Server executing on port %s", ServerPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			utils.LogFatal("Failed to run server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		utils.LogFatal("Server forced to shutdown: %v", err)
	}
}
