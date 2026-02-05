package utils

import (
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	jwtIssuer = "invesa"
	jwtExpiry = 24 * time.Hour
)

func jwtSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	return []byte(secret)
}

func ValidateJWTSecret() error {
	if os.Getenv("JWT_SECRET") == "" {
		return errors.New("JWT_SECRET is required")
	}
	return nil
}

func GenerateJWT(userID int) (string, error) {
	if err := ValidateJWTSecret(); err != nil {
		return "", err
	}
	claims := jwt.RegisteredClaims{
		Issuer:    jwtIssuer,
		Subject:   strconv.Itoa(userID),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(jwtExpiry)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret())
}

func ParseJWT(tokenStr string) (int, error) {
	if err := ValidateJWTSecret(); err != nil {
		return 0, err
	}
	token, err := jwt.ParseWithClaims(tokenStr, &jwt.RegisteredClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return jwtSecret(), nil
	})
	if err != nil || !token.Valid {
		return 0, errors.New("invalid token")
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok || claims.Subject == "" {
		return 0, errors.New("invalid claims")
	}

	userID, err := strconv.Atoi(claims.Subject)
	if err != nil || userID <= 0 {
		return 0, errors.New("invalid user")
	}

	return userID, nil
}
