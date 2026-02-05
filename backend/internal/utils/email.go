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

// SendRegistrationEmail sends a magic link to complete registration
func SendRegistrationEmail(toEmail, token string) error {
	smtpEmail := os.Getenv("SMTP_EMAIL")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	registrationLink := fmt.Sprintf("https://invesa-prod-he47.vercel.app/complete-registration?token=%s", token)

	// Fallback to console logging if SMTP creds are missing
	if smtpEmail == "" || smtpPassword == "" {
		log.Println("==================================================")
		log.Printf("MOCK EMAIL TO: %s\n", toEmail)
		log.Printf("REGISTRATION LINK: %s\n", registrationLink)
		log.Println("==================================================")
		return nil
	}

	m := gomail.NewMessage()
	m.SetHeader("From", smtpEmail)
	m.SetHeader("To", toEmail)
	m.SetHeader("Subject", "Complete Your Invesa Registration")
	m.SetBody("text/html", fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
			<h1 style="color: #f59e0b;">Welcome to Invesa!</h1>
			<p>You're almost there! Click the button below to complete your registration:</p>
			<p style="margin: 30px 0;">
				<a href="%s" style="background-color: #f59e0b; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Complete Registration</a>
			</p>
			<p style="color: #666;">This link expires in 24 hours.</p>
			<p style="color: #666;">If you didn't request this, please ignore this email.</p>
		</div>
	`, registrationLink))

	d := gomail.NewDialer("smtp.gmail.com", 587, smtpEmail, smtpPassword)

	if err := d.DialAndSend(m); err != nil {
		log.Printf("Failed to send registration email: %v\n", err)
		log.Println("FALLBACK LINK LOG:")
		log.Println(registrationLink)
		return err
	}

	return nil
}
