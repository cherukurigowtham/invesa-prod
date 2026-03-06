package app

import (
	"crypto/rand"
	"encoding/hex"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func hashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	return string(hash), nil
}

func comparePassword(hash string, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

func newID(prefix string) string {
	buf := make([]byte, 12)
	if _, err := rand.Read(buf); err != nil {
		panic(err)
	}

	return prefix + "_" + hex.EncodeToString(buf)
}

func normalizeEmail(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func sanitizeTags(tags []string) []string {
	seen := map[string]struct{}{}
	var result []string
	for _, tag := range tags {
		clean := strings.TrimSpace(strings.ToLower(tag))
		if clean == "" {
			continue
		}
		if _, exists := seen[clean]; exists {
			continue
		}
		seen[clean] = struct{}{}
		result = append(result, clean)
	}

	return result
}

func validateRegisterInput(input RegisterInput) error {
	if strings.TrimSpace(input.Name) == "" || normalizeEmail(input.Email) == "" || strings.TrimSpace(input.Password) == "" {
		return ErrValidation
	}
	if len(strings.TrimSpace(input.Password)) < 8 {
		return ErrValidation
	}
	return nil
}

func validateIdeaInput(input CreateIdeaInput) error {
	if strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Summary) == "" {
		return ErrValidation
	}
	return nil
}

func validateMessage(content string) error {
	if strings.TrimSpace(content) == "" {
		return ErrValidation
	}
	return nil
}
