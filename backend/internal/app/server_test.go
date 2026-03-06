package app

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"testing"
)

func TestAuthIdeaAndConversationFlow(t *testing.T) {
	store := NewMemoryStore()
	server := httptest.NewServer(NewServer(store, log.New(bytes.NewBuffer(nil), "", 0)))
	defer server.Close()

	client := &http.Client{}
	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatalf("cookie jar: %v", err)
	}
	client.Jar = jar

	registerPayload := map[string]string{
		"name":     "Maya Patel",
		"email":    "maya@example.com",
		"role":     "Product Builder",
		"password": "password123",
	}
	assertStatus(t, client, server.URL+"/api/auth/register", registerPayload, http.StatusCreated)

	ideaPayload := map[string]any{
		"title":    "Neighborhood commerce intelligence",
		"summary":  "Help local retailers understand repeat customers and footfall.",
		"category": "Retail",
		"stage":    "Prototype",
		"tags":     []string{"retail", "analytics"},
	}
	assertStatus(t, client, server.URL+"/api/ideas", ideaPayload, http.StatusCreated)

	sessionResponse := getJSON(t, client, server.URL+"/api/auth/session", http.StatusOK)
	if sessionResponse["user"] == nil {
		t.Fatalf("expected active user session")
	}
}

func assertStatus(t *testing.T, client *http.Client, url string, payload any, expected int) {
	t.Helper()
	body, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal payload: %v", err)
	}

	request, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		t.Fatalf("build request: %v", err)
	}
	request.Header.Set("Content-Type", "application/json")

	response, err := client.Do(request)
	if err != nil {
		t.Fatalf("do request: %v", err)
	}
	defer response.Body.Close()

	if response.StatusCode != expected {
		t.Fatalf("expected status %d, got %d", expected, response.StatusCode)
	}
}

func getJSON(t *testing.T, client *http.Client, url string, expected int) map[string]any {
	t.Helper()
	response, err := client.Get(url)
	if err != nil {
		t.Fatalf("get request: %v", err)
	}
	defer response.Body.Close()

	if response.StatusCode != expected {
		t.Fatalf("expected status %d, got %d", expected, response.StatusCode)
	}

	var payload map[string]any
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return payload
}
