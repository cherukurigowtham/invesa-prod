package app

import "context"

type Store interface {
	RegisterUser(ctx context.Context, input RegisterInput) (User, error)
	AuthenticateUser(ctx context.Context, input LoginInput) (User, error)
	CreateSession(ctx context.Context, userID string) (Session, error)
	GetUserBySession(ctx context.Context, sessionID string) (User, error)
	DeleteSession(ctx context.Context, sessionID string) error
	ListIdeas(ctx context.Context, viewerID string) ([]Idea, error)
	CreateIdea(ctx context.Context, userID string, input CreateIdeaInput) (Idea, error)
	ListConversations(ctx context.Context, userID string) ([]Conversation, error)
	ExpressInterest(ctx context.Context, userID string, ideaID string, input ExpressInterestInput) (Conversation, error)
	SendMessage(ctx context.Context, userID string, conversationID string, input SendMessageInput) (Conversation, error)
}
