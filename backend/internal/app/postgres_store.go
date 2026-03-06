package app

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

type PostgresStore struct {
	db *sql.DB
}

func NewPostgresStore(db *sql.DB) *PostgresStore {
	return &PostgresStore{db: db}
}

func (p *PostgresStore) RegisterUser(ctx context.Context, input RegisterInput) (User, error) {
	if err := validateRegisterInput(input); err != nil {
		return User{}, err
	}

	passwordHash, err := hashPassword(input.Password)
	if err != nil {
		return User{}, err
	}

	user := User{
		ID:        newID("user"),
		Name:      strings.TrimSpace(input.Name),
		Email:     normalizeEmail(input.Email),
		Role:      emptyFallback(strings.TrimSpace(input.Role), "Builder"),
		CreatedAt: time.Now().UTC(),
	}

	_, err = p.db.ExecContext(ctx, `
		INSERT INTO users (id, name, email, role, password_hash, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, user.ID, user.Name, user.Email, user.Role, passwordHash, user.CreatedAt)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
			return User{}, ErrConflict
		}
		return User{}, err
	}

	return user, nil
}

func (p *PostgresStore) AuthenticateUser(ctx context.Context, input LoginInput) (User, error) {
	var user User
	var passwordHash string
	err := p.db.QueryRowContext(ctx, `
		SELECT id, name, email, role, created_at, password_hash
		FROM users
		WHERE email = $1
	`, normalizeEmail(input.Email)).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.Role,
		&user.CreatedAt,
		&passwordHash,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return User{}, ErrUnauthorized
		}
		return User{}, err
	}

	if err := comparePassword(passwordHash, input.Password); err != nil {
		return User{}, ErrUnauthorized
	}

	return user, nil
}

func (p *PostgresStore) CreateSession(ctx context.Context, userID string) (Session, error) {
	session := Session{
		ID:        newID("session"),
		UserID:    userID,
		CreatedAt: time.Now().UTC(),
		ExpiresAt: time.Now().UTC().Add(30 * 24 * time.Hour),
	}

	_, err := p.db.ExecContext(ctx, `
		INSERT INTO sessions (id, user_id, created_at, expires_at)
		VALUES ($1, $2, $3, $4)
	`, session.ID, session.UserID, session.CreatedAt, session.ExpiresAt)
	if err != nil {
		return Session{}, err
	}

	return session, nil
}

func (p *PostgresStore) GetUserBySession(ctx context.Context, sessionID string) (User, error) {
	var user User
	err := p.db.QueryRowContext(ctx, `
		SELECT u.id, u.name, u.email, u.role, u.created_at
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.id = $1 AND s.expires_at > NOW()
	`, sessionID).Scan(&user.ID, &user.Name, &user.Email, &user.Role, &user.CreatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return User{}, ErrUnauthorized
		}
		return User{}, err
	}

	return user, nil
}

func (p *PostgresStore) DeleteSession(ctx context.Context, sessionID string) error {
	_, err := p.db.ExecContext(ctx, `DELETE FROM sessions WHERE id = $1`, sessionID)
	return err
}

func (p *PostgresStore) ListIdeas(ctx context.Context, viewerID string) ([]Idea, error) {
	query := `
		SELECT
			i.id,
			i.title,
			i.summary,
			i.category,
			i.stage,
			i.tags,
			i.created_at,
			u.id,
			u.name,
			u.role,
			COUNT(DISTINCT all_c.id) AS interest_count,
			COALESCE(BOOL_OR(viewer_c.id IS NOT NULL), FALSE) AS has_interest,
			COALESCE(MAX(viewer_c.id), '') AS conversation_id
		FROM ideas i
		JOIN users u ON u.id = i.author_id
		LEFT JOIN conversations all_c ON all_c.idea_id = i.id
		LEFT JOIN conversations viewer_c ON viewer_c.idea_id = i.id AND viewer_c.interested_user_id = $1
		GROUP BY i.id, u.id
		ORDER BY i.created_at DESC
	`

	rows, err := p.db.QueryContext(ctx, query, viewerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ideas []Idea
	for rows.Next() {
		var idea Idea
		var rawTags []byte
		if err := rows.Scan(
			&idea.ID,
			&idea.Title,
			&idea.Summary,
			&idea.Category,
			&idea.Stage,
			&rawTags,
			&idea.CreatedAt,
			&idea.Author.ID,
			&idea.Author.Name,
			&idea.Author.Role,
			&idea.InterestCount,
			&idea.HasExpressedInterest,
			&idea.ConversationID,
		); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(rawTags, &idea.Tags); err != nil {
			return nil, err
		}
		idea.IsOwner = idea.Author.ID == viewerID && viewerID != ""
		ideas = append(ideas, idea)
	}

	return ideas, rows.Err()
}

func (p *PostgresStore) CreateIdea(ctx context.Context, userID string, input CreateIdeaInput) (Idea, error) {
	if err := validateIdeaInput(input); err != nil {
		return Idea{}, err
	}

	idea := Idea{
		ID:        newID("idea"),
		Title:     strings.TrimSpace(input.Title),
		Summary:   strings.TrimSpace(input.Summary),
		Category:  emptyFallback(strings.TrimSpace(input.Category), "General"),
		Stage:     emptyFallback(strings.TrimSpace(input.Stage), "Concept"),
		Tags:      sanitizeTags(input.Tags),
		CreatedAt: time.Now().UTC(),
		IsOwner:   true,
	}

	if err := p.db.QueryRowContext(ctx, `
		SELECT id, name, role
		FROM users
		WHERE id = $1
	`, userID).Scan(&idea.Author.ID, &idea.Author.Name, &idea.Author.Role); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Idea{}, ErrUnauthorized
		}
		return Idea{}, err
	}

	tags, err := json.Marshal(idea.Tags)
	if err != nil {
		return Idea{}, err
	}

	_, err = p.db.ExecContext(ctx, `
		INSERT INTO ideas (id, author_id, title, summary, category, stage, tags, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, idea.ID, userID, idea.Title, idea.Summary, idea.Category, idea.Stage, tags, idea.CreatedAt)
	if err != nil {
		return Idea{}, err
	}

	return idea, nil
}

func (p *PostgresStore) ListConversations(ctx context.Context, userID string) ([]Conversation, error) {
	rows, err := p.db.QueryContext(ctx, `
		SELECT
			c.id,
			c.idea_id,
			i.title,
			c.updated_at,
			owner.id,
			owner.name,
			owner.role,
			interested.id,
			interested.name,
			interested.role
		FROM conversations c
		JOIN ideas i ON i.id = c.idea_id
		JOIN users owner ON owner.id = c.owner_id
		JOIN users interested ON interested.id = c.interested_user_id
		WHERE c.owner_id = $1 OR c.interested_user_id = $1
		ORDER BY c.updated_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var conversations []Conversation
	for rows.Next() {
		var conversation Conversation
		if err := rows.Scan(
			&conversation.ID,
			&conversation.IdeaID,
			&conversation.IdeaTitle,
			&conversation.UpdatedAt,
			&conversation.Owner.ID,
			&conversation.Owner.Name,
			&conversation.Owner.Role,
			&conversation.InterestedUser.ID,
			&conversation.InterestedUser.Name,
			&conversation.InterestedUser.Role,
		); err != nil {
			return nil, err
		}

		messages, err := p.listMessages(ctx, conversation.ID)
		if err != nil {
			return nil, err
		}
		conversation.Messages = messages
		conversations = append(conversations, conversation)
	}

	return conversations, rows.Err()
}

func (p *PostgresStore) ExpressInterest(ctx context.Context, userID string, ideaID string, input ExpressInterestInput) (Conversation, error) {
	if err := validateMessage(input.Message); err != nil {
		return Conversation{}, err
	}

	var ownerID string
	if err := p.db.QueryRowContext(ctx, `SELECT author_id FROM ideas WHERE id = $1`, ideaID).Scan(&ownerID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Conversation{}, ErrNotFound
		}
		return Conversation{}, err
	}

	if ownerID == userID {
		return Conversation{}, ErrForbidden
	}

	var existingID string
	err := p.db.QueryRowContext(ctx, `
		SELECT id
		FROM conversations
		WHERE idea_id = $1 AND interested_user_id = $2
	`, ideaID, userID).Scan(&existingID)
	if err == nil {
		return p.SendMessage(ctx, userID, existingID, SendMessageInput{Content: input.Message})
	}
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return Conversation{}, err
	}

	tx, err := p.db.BeginTx(ctx, nil)
	if err != nil {
		return Conversation{}, err
	}
	defer tx.Rollback()

	conversationID := newID("conversation")
	now := time.Now().UTC()
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO conversations (id, idea_id, owner_id, interested_user_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $5)
	`, conversationID, ideaID, ownerID, userID, now); err != nil {
		return Conversation{}, err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO messages (id, conversation_id, sender_id, content, sent_at)
		VALUES ($1, $2, $3, $4, $5)
	`, newID("message"), conversationID, userID, strings.TrimSpace(input.Message), now); err != nil {
		return Conversation{}, err
	}

	if err := tx.Commit(); err != nil {
		return Conversation{}, err
	}

	return p.getConversation(ctx, conversationID, userID)
}

func (p *PostgresStore) SendMessage(ctx context.Context, userID string, conversationID string, input SendMessageInput) (Conversation, error) {
	if err := validateMessage(input.Content); err != nil {
		return Conversation{}, err
	}

	var ownerID string
	var interestedUserID string
	err := p.db.QueryRowContext(ctx, `
		SELECT owner_id, interested_user_id
		FROM conversations
		WHERE id = $1
	`, conversationID).Scan(&ownerID, &interestedUserID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Conversation{}, ErrNotFound
		}
		return Conversation{}, err
	}

	if ownerID != userID && interestedUserID != userID {
		return Conversation{}, ErrForbidden
	}

	tx, err := p.db.BeginTx(ctx, nil)
	if err != nil {
		return Conversation{}, err
	}
	defer tx.Rollback()

	now := time.Now().UTC()
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO messages (id, conversation_id, sender_id, content, sent_at)
		VALUES ($1, $2, $3, $4, $5)
	`, newID("message"), conversationID, userID, strings.TrimSpace(input.Content), now); err != nil {
		return Conversation{}, err
	}

	if _, err := tx.ExecContext(ctx, `
		UPDATE conversations
		SET updated_at = $2
		WHERE id = $1
	`, conversationID, now); err != nil {
		return Conversation{}, err
	}

	if err := tx.Commit(); err != nil {
		return Conversation{}, err
	}

	return p.getConversation(ctx, conversationID, userID)
}

func (p *PostgresStore) getConversation(ctx context.Context, conversationID string, viewerID string) (Conversation, error) {
	var conversation Conversation
	var ownerID string
	var interestedID string
	err := p.db.QueryRowContext(ctx, `
		SELECT
			c.id,
			c.idea_id,
			i.title,
			c.updated_at,
			owner.id,
			owner.name,
			owner.role,
			interested.id,
			interested.name,
			interested.role
		FROM conversations c
		JOIN ideas i ON i.id = c.idea_id
		JOIN users owner ON owner.id = c.owner_id
		JOIN users interested ON interested.id = c.interested_user_id
		WHERE c.id = $1
	`, conversationID).Scan(
		&conversation.ID,
		&conversation.IdeaID,
		&conversation.IdeaTitle,
		&conversation.UpdatedAt,
		&ownerID,
		&conversation.Owner.Name,
		&conversation.Owner.Role,
		&interestedID,
		&conversation.InterestedUser.Name,
		&conversation.InterestedUser.Role,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Conversation{}, ErrNotFound
		}
		return Conversation{}, err
	}

	if viewerID != ownerID && viewerID != interestedID {
		return Conversation{}, ErrForbidden
	}

	conversation.Owner.ID = ownerID
	conversation.InterestedUser.ID = interestedID
	messages, err := p.listMessages(ctx, conversationID)
	if err != nil {
		return Conversation{}, err
	}
	conversation.Messages = messages
	return conversation, nil
}

func (p *PostgresStore) listMessages(ctx context.Context, conversationID string) ([]Message, error) {
	rows, err := p.db.QueryContext(ctx, `
		SELECT m.id, m.content, m.sent_at, u.id, u.name, u.role
		FROM messages m
		JOIN users u ON u.id = m.sender_id
		WHERE m.conversation_id = $1
		ORDER BY m.sent_at ASC
	`, conversationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var message Message
		if err := rows.Scan(
			&message.ID,
			&message.Content,
			&message.SentAt,
			&message.Sender.ID,
			&message.Sender.Name,
			&message.Sender.Role,
		); err != nil {
			return nil, err
		}
		messages = append(messages, message)
	}

	return messages, rows.Err()
}
