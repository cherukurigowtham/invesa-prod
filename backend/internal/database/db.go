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
		`CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			username VARCHAR(255) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL,
			full_name VARCHAR(255) NOT NULL DEFAULT '',
			email VARCHAR(255) UNIQUE NOT NULL DEFAULT '',
			bio TEXT,
			role VARCHAR(50) NOT NULL DEFAULT 'Entrepreneur',
			is_premium BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE`,
		`CREATE TABLE IF NOT EXISTS ideas (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id),
			title VARCHAR(255) NOT NULL,
			description TEXT NOT NULL,
			category VARCHAR(50) NOT NULL DEFAULT 'Other',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS messages (
			id SERIAL PRIMARY KEY,
			sender_id INTEGER REFERENCES users(id),
			receiver_id INTEGER REFERENCES users(id),
			content TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS idea_likes (
			user_id INTEGER REFERENCES users(id),
			idea_id INTEGER REFERENCES ideas(id),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (user_id, idea_id)
		)`,
		`CREATE TABLE IF NOT EXISTS password_resets (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			token TEXT NOT NULL,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS registration_tokens (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255) NOT NULL,
			token TEXT NOT NULL UNIQUE,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS comments (
			id SERIAL PRIMARY KEY,
			idea_id INTEGER REFERENCES ideas(id),
			user_id INTEGER REFERENCES users(id),
			content TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE INDEX IF NOT EXISTS idx_ideas_category ON ideas(category)`,
		`CREATE INDEX IF NOT EXISTS idx_ideas_userid ON ideas(user_id)`,
		`CREATE INDEX IF NOT EXISTS idx_likes_ideaid ON idea_likes(idea_id)`,
		`CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id, created_at)`,
	}

	for _, query := range queries {
		_, err := DB.Exec(context.Background(), query)
		if err != nil {
			return fmt.Errorf("failed to execute query: %s, error: %v", query, err)
		}
	}

	return nil
}
