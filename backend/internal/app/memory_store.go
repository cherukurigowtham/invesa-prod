package app

import (
	"context"
	"slices"
	"sort"
	"sync"
	"time"
)

type memoryUser struct {
	User
	PasswordHash string
}

type MemoryStore struct {
	mu            sync.RWMutex
	users         map[string]memoryUser
	usersByEmail  map[string]string
	sessions      map[string]Session
	ideas         map[string]Idea
	conversations map[string]Conversation
}

func NewMemoryStore() *MemoryStore {
	store := &MemoryStore{
		users:         map[string]memoryUser{},
		usersByEmail:  map[string]string{},
		sessions:      map[string]Session{},
		ideas:         map[string]Idea{},
		conversations: map[string]Conversation{},
	}

	founder, _ := store.RegisterUser(context.Background(), RegisterInput{
		Name:     "Aarav Menon",
		Email:    "aarav@invesa.app",
		Role:     "Founder",
		Password: "password123",
	})
	builder, _ := store.RegisterUser(context.Background(), RegisterInput{
		Name:     "Nikhil Rao",
		Email:    "nikhil@invesa.app",
		Role:     "Growth Marketer",
		Password: "password123",
	})

	idea, _ := store.CreateIdea(context.Background(), founder.ID, CreateIdeaInput{
		Title:    "AI-powered founder matching",
		Summary:  "Match early-stage founders with operators, marketers, and investors based on traction, sector, and skill gaps.",
		Category: "SaaS",
		Stage:    "MVP",
		Tags:     []string{"matching", "founders", "ai"},
	})

	_, _ = store.ExpressInterest(context.Background(), builder.ID, idea.ID, ExpressInterestInput{
		Message: "I can help validate acquisition channels and onboarding loops.",
	})

	return store
}

func (m *MemoryStore) RegisterUser(_ context.Context, input RegisterInput) (User, error) {
	if err := validateRegisterInput(input); err != nil {
		return User{}, err
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	email := normalizeEmail(input.Email)
	if _, exists := m.usersByEmail[email]; exists {
		return User{}, ErrConflict
	}

	passwordHash, err := hashPassword(input.Password)
	if err != nil {
		return User{}, err
	}

	user := User{
		ID:        newID("user"),
		Name:      input.Name,
		Email:     email,
		Role:      emptyFallback(input.Role, "Builder"),
		CreatedAt: time.Now().UTC(),
	}

	m.users[user.ID] = memoryUser{User: user, PasswordHash: passwordHash}
	m.usersByEmail[email] = user.ID
	return user, nil
}

func (m *MemoryStore) AuthenticateUser(_ context.Context, input LoginInput) (User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	userID, exists := m.usersByEmail[normalizeEmail(input.Email)]
	if !exists {
		return User{}, ErrUnauthorized
	}

	record := m.users[userID]
	if err := comparePassword(record.PasswordHash, input.Password); err != nil {
		return User{}, ErrUnauthorized
	}

	return record.User, nil
}

func (m *MemoryStore) CreateSession(_ context.Context, userID string) (Session, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.users[userID]; !exists {
		return Session{}, ErrNotFound
	}

	session := Session{
		ID:        newID("session"),
		UserID:    userID,
		CreatedAt: time.Now().UTC(),
		ExpiresAt: time.Now().UTC().Add(30 * 24 * time.Hour),
	}
	m.sessions[session.ID] = session
	return session, nil
}

func (m *MemoryStore) GetUserBySession(_ context.Context, sessionID string) (User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	session, exists := m.sessions[sessionID]
	if !exists || session.ExpiresAt.Before(time.Now().UTC()) {
		return User{}, ErrUnauthorized
	}

	record, exists := m.users[session.UserID]
	if !exists {
		return User{}, ErrUnauthorized
	}

	return record.User, nil
}

func (m *MemoryStore) DeleteSession(_ context.Context, sessionID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.sessions, sessionID)
	return nil
}

func (m *MemoryStore) ListIdeas(_ context.Context, viewerID string) ([]Idea, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var ideas []Idea
	for _, idea := range m.ideas {
		cloned := idea
		cloned.IsOwner = cloned.Author.ID == viewerID
		for _, conversation := range m.conversations {
			if conversation.IdeaID == idea.ID {
				cloned.InterestCount++
				if viewerID != "" && conversation.InterestedUser.ID == viewerID {
					cloned.HasExpressedInterest = true
					cloned.ConversationID = conversation.ID
				}
			}
		}
		ideas = append(ideas, cloned)
	}

	sort.Slice(ideas, func(i int, j int) bool {
		return ideas[i].CreatedAt.After(ideas[j].CreatedAt)
	})

	return ideas, nil
}

func (m *MemoryStore) CreateIdea(_ context.Context, userID string, input CreateIdeaInput) (Idea, error) {
	if err := validateIdeaInput(input); err != nil {
		return Idea{}, err
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	record, exists := m.users[userID]
	if !exists {
		return Idea{}, ErrUnauthorized
	}

	idea := Idea{
		ID:        newID("idea"),
		Title:     input.Title,
		Summary:   input.Summary,
		Category:  emptyFallback(input.Category, "General"),
		Stage:     emptyFallback(input.Stage, "Concept"),
		Tags:      sanitizeTags(input.Tags),
		CreatedAt: time.Now().UTC(),
		Author: UserSummary{
			ID:   record.ID,
			Name: record.Name,
			Role: record.Role,
		},
		IsOwner: true,
	}

	m.ideas[idea.ID] = idea
	return idea, nil
}

func (m *MemoryStore) ListConversations(_ context.Context, userID string) ([]Conversation, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var conversations []Conversation
	for _, conversation := range m.conversations {
		if conversation.Owner.ID != userID && conversation.InterestedUser.ID != userID {
			continue
		}
		conversations = append(conversations, cloneConversation(conversation))
	}

	sort.Slice(conversations, func(i int, j int) bool {
		return conversations[i].UpdatedAt.After(conversations[j].UpdatedAt)
	})

	return conversations, nil
}

func (m *MemoryStore) ExpressInterest(_ context.Context, userID string, ideaID string, input ExpressInterestInput) (Conversation, error) {
	if err := validateMessage(input.Message); err != nil {
		return Conversation{}, err
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	idea, exists := m.ideas[ideaID]
	if !exists {
		return Conversation{}, ErrNotFound
	}
	if idea.Author.ID == userID {
		return Conversation{}, ErrForbidden
	}

	for id, conversation := range m.conversations {
		if conversation.IdeaID == ideaID && conversation.InterestedUser.ID == userID {
			updated, err := m.appendMessageLocked(id, userID, input.Message)
			if err != nil {
				return Conversation{}, err
			}
			return updated, nil
		}
	}

	user := m.users[userID].User
	now := time.Now().UTC()
	conversation := Conversation{
		ID:        newID("conversation"),
		IdeaID:    idea.ID,
		IdeaTitle: idea.Title,
		Owner:     idea.Author,
		InterestedUser: UserSummary{
			ID:   user.ID,
			Name: user.Name,
			Role: user.Role,
		},
		UpdatedAt: now,
		Messages: []Message{
			{
				ID: newID("message"),
				Sender: UserSummary{
					ID:   user.ID,
					Name: user.Name,
					Role: user.Role,
				},
				Content: input.Message,
				SentAt:  now,
			},
		},
	}

	m.conversations[conversation.ID] = conversation
	return cloneConversation(conversation), nil
}

func (m *MemoryStore) SendMessage(_ context.Context, userID string, conversationID string, input SendMessageInput) (Conversation, error) {
	if err := validateMessage(input.Content); err != nil {
		return Conversation{}, err
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	return m.appendMessageLocked(conversationID, userID, input.Content)
}

func (m *MemoryStore) appendMessageLocked(conversationID string, userID string, content string) (Conversation, error) {
	conversation, exists := m.conversations[conversationID]
	if !exists {
		return Conversation{}, ErrNotFound
	}
	if conversation.Owner.ID != userID && conversation.InterestedUser.ID != userID {
		return Conversation{}, ErrForbidden
	}

	user := m.users[userID].User
	conversation.Messages = append(conversation.Messages, Message{
		ID: newID("message"),
		Sender: UserSummary{
			ID:   user.ID,
			Name: user.Name,
			Role: user.Role,
		},
		Content: content,
		SentAt:  time.Now().UTC(),
	})
	conversation.UpdatedAt = time.Now().UTC()
	m.conversations[conversationID] = conversation
	return cloneConversation(conversation), nil
}

func cloneConversation(value Conversation) Conversation {
	cloned := value
	cloned.Messages = slices.Clone(value.Messages)
	return cloned
}

func emptyFallback(value string, fallback string) string {
	if value == "" {
		return fallback
	}

	return value
}
