package utils

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
)

// ValidateSupabaseToken calls Supabase Auth API to verify the token
func ValidateSupabaseToken(tokenStr string) (string, error) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	apiKey := os.Getenv("SUPABASE_ANON_KEY")

	if supabaseURL == "" || apiKey == "" {
		return "", errors.New("missing Supabase configuration")
	}

	client := &http.Client{}
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/auth/v1/user", supabaseURL), nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+tokenStr)
	req.Header.Set("apikey", apiKey)

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", errors.New("invalid token")
	}

	var result struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	return result.ID, nil
}
