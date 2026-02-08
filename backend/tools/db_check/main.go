package main

import (
	"context"
	"fmt"

	// "os" removed
	"time"

	"github.com/jackc/pgx/v5"
)

func main() {
	// Password with encoded @ -> %40
	passwordEncoded := "Cg%408074217420"
	projectRef := "sidbmikcnawwqaridibp"

	candidates := []struct {
		name string
		dsn  string
	}{
		{
			name: "Transaction Pooler (Port 6543, sslmode=disable)",
			dsn:  fmt.Sprintf("postgres://postgres.%s:%s@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=disable", projectRef, passwordEncoded),
		},
		{
			name: "Transaction Pooler (Port 6543, sslmode=require)",
			dsn:  fmt.Sprintf("postgres://postgres.%s:%s@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require", projectRef, passwordEncoded),
		},
		{
			name: "Session Pooler (Port 5432, sslmode=disable)",
			dsn:  fmt.Sprintf("postgres://postgres.%s:%s@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=disable", projectRef, passwordEncoded),
		},
		{
			name: "Session Pooler (Port 5432, sslmode=require)",
			dsn:  fmt.Sprintf("postgres://postgres.%s:%s@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require", projectRef, passwordEncoded),
		},
		{
			name: "Direct Connection (Port 5432)",
			dsn:  fmt.Sprintf("postgres://postgres:%s@db.%s.supabase.co:5432/postgres?sslmode=require", passwordEncoded, projectRef),
		},
	}

	fmt.Println("Starting connection tests...")
	fmt.Println("---------------------------------------------------")

	for _, c := range candidates {
		fmt.Printf("Testing: %s\n", c.name)
		fmt.Printf("DSN: %s\n", c.dsn)

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		conn, err := pgx.Connect(ctx, c.dsn)
		if err != nil {
			fmt.Printf("❌ Connection Failed: %v\n", err)
		} else {
			err = conn.Ping(ctx)
			conn.Close(context.Background())
			if err != nil {
				fmt.Printf("❌ Ping Failed: %v\n", err)
			} else {
				fmt.Printf("✅ SUCCESS! This connection string works.\n")
				fmt.Println("---------------------------------------------------")
				fmt.Println(">>> USE THIS CONNECTION STRING IN RENDER <<<")
				fmt.Println(c.dsn)
				fmt.Println("---------------------------------------------------")
				break
			}
		}
		cancel()
		fmt.Println("---------------------------------------------------")
	}
}
