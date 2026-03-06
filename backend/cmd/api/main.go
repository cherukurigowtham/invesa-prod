package main

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"

	"invesa/backend/internal/app"
)

func main() {
	logger := log.New(os.Stdout, "invesa-api ", log.LstdFlags|log.Lshortfile)

	store, cleanup, err := buildStore()
	if err != nil {
		logger.Fatalf("build store: %v", err)
	}
	defer cleanup()

	server := &http.Server{
		Addr:              normalizeAddr(os.Getenv("PORT")),
		Handler:           app.NewServer(store, logger),
		ReadHeaderTimeout: 5 * time.Second,
	}

	logger.Printf("listening on %s", server.Addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logger.Fatalf("server failed: %v", err)
	}
}

func buildStore() (app.Store, func(), error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return app.NewMemoryStore(), func() {}, nil
	}

	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return nil, nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, nil, err
	}

	if err := app.ApplySchema(ctx, db); err != nil {
		db.Close()
		return nil, nil, err
	}

	return app.NewPostgresStore(db), func() {
		_ = db.Close()
	}, nil
}

func normalizeAddr(value string) string {
	if value == "" {
		return "0.0.0.0:8080"
	}

	if len(value) > 0 && value[0] != ':' && !containsHost(value) {
		return ":" + value
	}

	return value
}

func containsHost(value string) bool {
	for _, char := range value {
		if char == ':' {
			return true
		}
	}

	return false
}
