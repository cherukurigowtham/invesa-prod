package utils

import (
	"fmt"
	"log"
	"os"

	"gopkg.in/gomail.v2"
)

// SendResetEmail sends a password reset link to the user's email
func SendResetEmail(toEmail, token string) error {
	smtpEmail := os.Getenv("SMTP_EMAIL")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	resetLink := fmt.Sprintf("https://invesa-prod-he47.vercel.app/reset-password?token=%s", token)

	// Fallback to console logging if SMTP creds are missing
	if smtpEmail == "" || smtpPassword == "" {
		log.Println("==================================================")
		log.Printf("MOCK EMAIL TO: %s\n", toEmail)
		log.Printf("RESET LINK: %s\n", resetLink)
		log.Println("==================================================")
		return nil
	}

	m := gomail.NewMessage()
	m.SetHeader("From", smtpEmail)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", "Reset Your Invesa Password")
	m.SetBody("text/html", fmt.Sprintf(`
		<h1>Reset Password</h1>
		<p>Click the link below to reset your password:</p>
		<p><a href="%s">Reset Password</a></p>
		<p>If you didn't request this, please ignore this email.</p>
	`, resetLink))

	d := gomail.NewDialer("smtp.gmail.com", 587, smtpEmail, smtpPassword)

	if err := d.DialAndSend(m); err != nil {
		log.Printf("Failed to send email: %v\n", err)
		// Fallback logging even if sending fails
		log.Println("FALLBACK LINK LOG:")
		log.Println(resetLink)
		return err
	}

	return nil
}
