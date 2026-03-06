package app

import "time"

type UserSummary struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Role string `json:"role"`
}

type User struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
}

type Session struct {
	ID        string
	UserID    string
	ExpiresAt time.Time
	CreatedAt time.Time
}

type Idea struct {
	ID                   string      `json:"id"`
	Title                string      `json:"title"`
	Summary              string      `json:"summary"`
	Category             string      `json:"category"`
	Stage                string      `json:"stage"`
	Tags                 []string    `json:"tags"`
	CreatedAt            time.Time   `json:"createdAt"`
	Author               UserSummary `json:"author"`
	InterestCount        int         `json:"interestCount"`
	IsOwner              bool        `json:"isOwner"`
	HasExpressedInterest bool        `json:"hasExpressedInterest"`
	ConversationID       string      `json:"conversationId,omitempty"`
}

type Conversation struct {
	ID             string      `json:"id"`
	IdeaID         string      `json:"ideaId"`
	IdeaTitle      string      `json:"ideaTitle"`
	Owner          UserSummary `json:"owner"`
	InterestedUser UserSummary `json:"interestedUser"`
	Messages       []Message   `json:"messages"`
	UpdatedAt      time.Time   `json:"updatedAt"`
}

type Message struct {
	ID      string      `json:"id"`
	Sender  UserSummary `json:"sender"`
	Content string      `json:"content"`
	SentAt  time.Time   `json:"sentAt"`
}

type RegisterInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	Password string `json:"password"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type CreateIdeaInput struct {
	Title    string   `json:"title"`
	Summary  string   `json:"summary"`
	Category string   `json:"category"`
	Stage    string   `json:"stage"`
	Tags     []string `json:"tags"`
}

type ExpressInterestInput struct {
	Message string `json:"message"`
}

type SendMessageInput struct {
	Content string `json:"content"`
}
