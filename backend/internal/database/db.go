package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func Connect() error {
	// Priority 1: Use full connection string if provided (Standard for Render/Heroku)
	dbURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dbURL != "" {
		log.Println("Attempting to connect via DATABASE_URL env var...")
		var err error
		DB, err = pgxpool.New(context.Background(), dbURL)
		if err != nil {
			return fmt.Errorf("unable to connect to database (URL): %v", err)
		}
		if err := DB.Ping(context.Background()); err != nil {
			return fmt.Errorf("unable to ping database (URL): %v", err)
		}
		log.Println("Connected to database successfully (via DATABASE_URL)")
		return nil
	}

	log.Println("DATABASE_URL not found, falling back to individual env vars...")

	// Priority 2: Construct from individual vars (Manual setup)
	host := getEnv("DB_HOST", "localhost")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "password")
	dbname := getEnv("DB_NAME", "invesa")
	port := getEnv("DB_PORT", "5432")
	sslmode := getEnv("DB_SSLMODE", "disable") // disable for local, require for prod

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		user, password, host, port, dbname, sslmode)

	log.Printf("Connecting with DSN: postgres://%s:****@%s:%s/%s?sslmode=%s", user, host, port, dbname, sslmode)

	var err error
	DB, err = pgxpool.New(context.Background(), dsn)
	if err != nil {
		return fmt.Errorf("unable to connect to database: %v", err)
	}

	if err := DB.Ping(context.Background()); err != nil {
		return fmt.Errorf("unable to ping database: %v", err)
	}

	log.Println("Connected to database successfully")
	return nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func CreateTables() error {
	queries := []string{
		`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,

		`CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY, -- Matches Supabase Auth ID (or self-generated)
			username VARCHAR(255) UNIQUE,
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			full_name VARCHAR(255) DEFAULT '',
			bio TEXT,
			role VARCHAR(50) NOT NULL DEFAULT 'Entrepreneur',
			reset_token VARCHAR(255),
			reset_token_expiry TIMESTAMP,
			is_verified BOOLEAN DEFAULT FALSE,
			verification_token VARCHAR(255),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS ideas (
			id SERIAL PRIMARY KEY,
			user_id UUID REFERENCES users(id) ON DELETE CASCADE,
			title VARCHAR(255) NOT NULL,
			description TEXT NOT NULL,
			category VARCHAR(50) NOT NULL DEFAULT 'Other',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS messages (
			id SERIAL PRIMARY KEY,
			sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
			receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
			content TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS idea_likes (
			user_id UUID REFERENCES users(id) ON DELETE CASCADE,
			idea_id INTEGER REFERENCES ideas(id) ON DELETE CASCADE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (user_id, idea_id)
		)`,

		`CREATE TABLE IF NOT EXISTS activity_logs (
			id SERIAL PRIMARY KEY,
			user_id UUID REFERENCES users(id) ON DELETE SET NULL,
			action VARCHAR(50) NOT NULL,
			details TEXT,
			ip_address VARCHAR(50),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS feedback (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255),
			message TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE INDEX IF NOT EXISTS idx_ideas_category ON ideas(category)`,
		`CREATE INDEX IF NOT EXISTS idx_ideas_userid ON ideas(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_likes_ideaid ON idea_likes(idea_id)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id, created_at)`,
		`CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at)`,
		`CREATE INDEX IF NOT EXISTS idx_activity_logs_userid ON activity_logs(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at)`,
	}

	for _, query := range queries {
		_, err := DB.Exec(context.Background(), query)
		if err != nil {
			return fmt.Errorf("failed to execute query: %s, error: %v", query, err)
		}
	}

	return nil
}
