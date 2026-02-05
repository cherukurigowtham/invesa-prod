package models

import "time"

type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Password  string    `json:"password"`
	FullName  string    `json:"full_name"`
	Email     string    `json:"email"`
	Bio       string    `json:"bio"`
	Role      string    `json:"role"`
	IsPremium bool      `json:"is_premium"`
	CreatedAt time.Time `json:"created_at"`
}

type Idea struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	LikesCount  int       `json:"likes_count"`
	CreatedAt   time.Time `json:"created_at"`
	IsLiked     bool      `json:"is_liked"` // Helper for frontend
}

type Comment struct {
	ID        int       `json:"id"`
	IdeaID    int       `json:"idea_id"`
	UserID    int       `json:"user_id"`
	Username  string    `json:"username"` // Helper for frontend
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type Message struct {
	ID         int       `json:"id"`
	SenderID   int       `json:"sender_id"`
	ReceiverID int       `json:"receiver_id"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"created_at"`
}

type AdCampaign struct {
	ID           int        `json:"id"`
	Advertiser   string     `json:"advertiser_name"`
	ContactEmail string     `json:"contact_email"`
	Placement    string     `json:"placement"`
	Headline     string     `json:"headline"`
	CtaURL       string     `json:"cta_url"`
	Requirements string     `json:"requirements"`
	PriceINR     int        `json:"price_inr"`
	Status       string     `json:"status"`
	StartsAt     *time.Time `json:"starts_at,omitempty"`
	EndsAt       *time.Time `json:"ends_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}
