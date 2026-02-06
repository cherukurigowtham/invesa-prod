package models

import "time"

type User struct {
	ID        string    `json:"id"` // UUID
	Username  string    `json:"username"`
	Password  string    `json:"password"`
	FullName  string    `json:"full_name"`
	Email     string    `json:"email"`
	Bio       string    `json:"bio"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type Idea struct {
	ID          int       `json:"id"`
	UserID      string    `json:"user_id"` // UUID
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	LikesCount  int       `json:"likes_count"`
	CreatedAt   time.Time `json:"created_at"`
	IsLiked     bool      `json:"is_liked"`
}

type Comment struct {
	ID        int       `json:"id"`
	IdeaID    int       `json:"idea_id"`
	UserID    string    `json:"user_id"` // UUID
	Username  string    `json:"username"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type Message struct {
	ID         int       `json:"id"`
	SenderID   string    `json:"sender_id"`   // UUID
	ReceiverID string    `json:"receiver_id"` // UUID
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"created_at"`
}
