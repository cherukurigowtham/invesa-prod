package app

import (
	"encoding/json"
	"errors"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const sessionCookieName = "invesa_session"

type Server struct {
	store         Store
	logger        *log.Logger
	mux           *http.ServeMux
	allowedOrigin string
	secureCookie  bool
	staticFS      fs.FS
}

func NewServer(store Store, logger *log.Logger) *Server {
	server := &Server{
		store:         store,
		logger:        logger,
		mux:           http.NewServeMux(),
		allowedOrigin: emptyFallback(os.Getenv("FRONTEND_URL"), "http://localhost:5173"),
		secureCookie:  os.Getenv("COOKIE_SECURE") == "true" || strings.EqualFold(os.Getenv("APP_ENV"), "production"),
		staticFS:      resolveStaticFS(),
	}

	server.routes()
	return server
}

func (s *Server) ServeHTTP(writer http.ResponseWriter, request *http.Request) {
	if request.Method == http.MethodOptions {
		s.applyCORS(writer, request)
		writer.WriteHeader(http.StatusNoContent)
		return
	}

	if s.shouldServeSPA(request.URL.Path) {
		s.serveSPA(writer, request)
		return
	}
	s.mux.ServeHTTP(writer, request)
}

func (s *Server) routes() {
	s.mux.HandleFunc("/health", s.handleHealth)
	s.mux.HandleFunc("/api/auth/register", s.handleRegister)
	s.mux.HandleFunc("/api/auth/login", s.handleLogin)
	s.mux.HandleFunc("/api/auth/logout", s.handleLogout)
	s.mux.HandleFunc("/api/auth/session", s.handleSession)
	s.mux.HandleFunc("/api/ideas", s.handleIdeas)
	s.mux.HandleFunc("/api/ideas/", s.handleIdeaInterest)
	s.mux.HandleFunc("/api/conversations", s.handleConversations)
	s.mux.HandleFunc("/api/conversations/", s.handleConversationMessages)
}

func (s *Server) handleHealth(writer http.ResponseWriter, request *http.Request) {
	s.writeResponse(writer, request, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleRegister(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		s.writeError(writer, request, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var input RegisterInput
	if err := s.decodeJSON(request, &input); err != nil {
		s.writeError(writer, request, http.StatusBadRequest, "invalid registration payload")
		return
	}

	user, err := s.store.RegisterUser(request.Context(), input)
	if err != nil {
		s.handleStoreError(writer, request, err)
		return
	}

	session, err := s.store.CreateSession(request.Context(), user.ID)
	if err != nil {
		s.handleStoreError(writer, request, err)
		return
	}

	s.setSessionCookie(writer, session)
	s.writeResponse(writer, request, http.StatusCreated, map[string]any{"user": user})
}

func (s *Server) handleLogin(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		s.writeError(writer, request, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var input LoginInput
	if err := s.decodeJSON(request, &input); err != nil {
		s.writeError(writer, request, http.StatusBadRequest, "invalid login payload")
		return
	}

	user, err := s.store.AuthenticateUser(request.Context(), input)
	if err != nil {
		s.handleStoreError(writer, request, err)
		return
	}

	session, err := s.store.CreateSession(request.Context(), user.ID)
	if err != nil {
		s.handleStoreError(writer, request, err)
		return
	}

	s.setSessionCookie(writer, session)
	s.writeResponse(writer, request, http.StatusOK, map[string]any{"user": user})
}

func (s *Server) handleLogout(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost {
		s.writeError(writer, request, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	if cookie, err := request.Cookie(sessionCookieName); err == nil {
		_ = s.store.DeleteSession(request.Context(), cookie.Value)
	}

	http.SetCookie(writer, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   s.secureCookie,
	})

	s.writeResponse(writer, request, http.StatusOK, map[string]any{"ok": true})
}

func (s *Server) handleSession(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodGet {
		s.writeError(writer, request, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	user, err := s.currentUser(request)
	if err != nil {
		if errors.Is(err, ErrUnauthorized) {
			s.writeResponse(writer, request, http.StatusOK, map[string]any{"user": nil})
			return
		}
		s.handleStoreError(writer, request, err)
		return
	}

	s.writeResponse(writer, request, http.StatusOK, map[string]any{"user": user})
}

func (s *Server) handleIdeas(writer http.ResponseWriter, request *http.Request) {
	switch request.Method {
	case http.MethodGet:
		viewerID := ""
		if user, err := s.currentUser(request); err == nil {
			viewerID = user.ID
		}

		ideas, err := s.store.ListIdeas(request.Context(), viewerID)
		if err != nil {
			s.handleStoreError(writer, request, err)
			return
		}

		s.writeResponse(writer, request, http.StatusOK, map[string]any{"ideas": ideas})
	case http.MethodPost:
		user, err := s.requireUser(request)
		if err != nil {
			s.handleStoreError(writer, request, err)
			return
		}

		var input CreateIdeaInput
		if err := s.decodeJSON(request, &input); err != nil {
			s.writeError(writer, request, http.StatusBadRequest, "invalid idea payload")
			return
		}

		idea, err := s.store.CreateIdea(request.Context(), user.ID, input)
		if err != nil {
			s.handleStoreError(writer, request, err)
			return
		}

		s.writeResponse(writer, request, http.StatusCreated, map[string]any{"idea": idea})
	default:
		s.writeError(writer, request, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (s *Server) handleIdeaInterest(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost || !strings.HasSuffix(request.URL.Path, "/interest") {
		s.writeError(writer, request, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	user, err := s.requireUser(request)
	if err != nil {
		s.handleStoreError(writer, request, err)
		return
	}

	ideaID := strings.TrimSuffix(strings.TrimPrefix(request.URL.Path, "/api/ideas/"), "/interest")
	ideaID = strings.TrimSuffix(ideaID, "/")
	if ideaID == "" {
		s.writeError(writer, request, http.StatusBadRequest, "missing idea id")
		return
	}

	var input ExpressInterestInput
	if err := s.decodeJSON(request, &input); err != nil {
		s.writeError(writer, request, http.StatusBadRequest, "invalid interest payload")
		return
	}

	conversation, err := s.store.ExpressInterest(request.Context(), user.ID, ideaID, input)
	if err != nil {
		s.handleStoreError(writer, request, err)
		return
	}

	s.writeResponse(writer, request, http.StatusCreated, map[string]any{"conversation": conversation})
}

func (s *Server) handleConversations(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodGet {
		s.writeError(writer, request, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	user, err := s.requireUser(request)
	if err != nil {
		s.handleStoreError(writer, request, err)
		return
	}

	conversations, err := s.store.ListConversations(request.Context(), user.ID)
	if err != nil {
		s.handleStoreError(writer, request, err)
		return
	}

	s.writeResponse(writer, request, http.StatusOK, map[string]any{"conversations": conversations})
}

func (s *Server) handleConversationMessages(writer http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodPost || !strings.HasSuffix(request.URL.Path, "/messages") {
		s.writeError(writer, request, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	user, err := s.requireUser(request)
	if err != nil {
		s.handleStoreError(writer, request, err)
		return
	}

	conversationID := strings.TrimSuffix(strings.TrimPrefix(request.URL.Path, "/api/conversations/"), "/messages")
	conversationID = strings.TrimSuffix(conversationID, "/")
	if conversationID == "" {
		s.writeError(writer, request, http.StatusBadRequest, "missing conversation id")
		return
	}

	var input SendMessageInput
	if err := s.decodeJSON(request, &input); err != nil {
		s.writeError(writer, request, http.StatusBadRequest, "invalid message payload")
		return
	}

	conversation, err := s.store.SendMessage(request.Context(), user.ID, conversationID, input)
	if err != nil {
		s.handleStoreError(writer, request, err)
		return
	}

	s.writeResponse(writer, request, http.StatusCreated, map[string]any{"conversation": conversation})
}

func (s *Server) currentUser(request *http.Request) (User, error) {
	cookie, err := request.Cookie(sessionCookieName)
	if err != nil || cookie.Value == "" {
		return User{}, ErrUnauthorized
	}

	user, err := s.store.GetUserBySession(request.Context(), cookie.Value)
	if err != nil {
		return User{}, err
	}

	return user, nil
}

func (s *Server) requireUser(request *http.Request) (User, error) {
	return s.currentUser(request)
}

func (s *Server) setSessionCookie(writer http.ResponseWriter, session Session) {
	http.SetCookie(writer, &http.Cookie{
		Name:     sessionCookieName,
		Value:    session.ID,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   s.secureCookie,
		Expires:  session.ExpiresAt,
	})
}

func (s *Server) decodeJSON(request *http.Request, destination any) error {
	decoder := json.NewDecoder(io.LimitReader(request.Body, 1<<20))
	decoder.DisallowUnknownFields()
	return decoder.Decode(destination)
}

func (s *Server) writeResponse(writer http.ResponseWriter, request *http.Request, status int, payload any) {
	s.applyCORS(writer, request)
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	_ = json.NewEncoder(writer).Encode(payload)
}

func (s *Server) writeError(writer http.ResponseWriter, request *http.Request, status int, message string) {
	s.writeResponse(writer, request, status, map[string]string{"error": message})
}

func (s *Server) handleStoreError(writer http.ResponseWriter, request *http.Request, err error) {
	switch {
	case errors.Is(err, ErrUnauthorized):
		s.writeError(writer, request, http.StatusUnauthorized, "authentication required")
	case errors.Is(err, ErrForbidden):
		s.writeError(writer, request, http.StatusForbidden, "you cannot perform this action")
	case errors.Is(err, ErrNotFound):
		s.writeError(writer, request, http.StatusNotFound, "resource not found")
	case errors.Is(err, ErrConflict):
		s.writeError(writer, request, http.StatusConflict, "resource already exists")
	case errors.Is(err, ErrValidation):
		s.writeError(writer, request, http.StatusBadRequest, "invalid input")
	default:
		s.logger.Printf("request failed: %v", err)
		s.writeError(writer, request, http.StatusInternalServerError, "internal server error")
	}
}

func (s *Server) applyCORS(writer http.ResponseWriter, request *http.Request) {
	origin := request.Header.Get("Origin")
	if origin != "" && origin == s.allowedOrigin {
		writer.Header().Set("Access-Control-Allow-Origin", origin)
		writer.Header().Set("Access-Control-Allow-Credentials", "true")
	}
	writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	writer.Header().Set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
	writer.Header().Set("Vary", "Origin")
}

func (s *Server) shouldServeSPA(path string) bool {
	if s.staticFS == nil {
		return false
	}

	return path == "/" || (!strings.HasPrefix(path, "/api/") && path != "/health")
}

func (s *Server) serveSPA(writer http.ResponseWriter, request *http.Request) {
	target := strings.TrimPrefix(filepath.Clean(request.URL.Path), "/")
	if target == "." || target == "" {
		target = "index.html"
	}

	if _, err := fs.Stat(s.staticFS, target); err == nil {
		http.FileServer(http.FS(s.staticFS)).ServeHTTP(writer, request)
		return
	}

	index, err := fs.ReadFile(s.staticFS, "index.html")
	if err != nil {
		http.NotFound(writer, request)
		return
	}

	writer.Header().Set("Content-Type", "text/html; charset=utf-8")
	writer.WriteHeader(http.StatusOK)
	_, _ = writer.Write(index)
}

func resolveStaticFS() fs.FS {
	candidates := []string{
		os.Getenv("STATIC_DIR"),
		"./frontend/dist",
		"../frontend/dist",
	}

	for _, candidate := range candidates {
		if candidate == "" {
			continue
		}
		if info, err := os.Stat(candidate); err == nil && info.IsDir() {
			return os.DirFS(candidate)
		}
	}

	return nil
}
