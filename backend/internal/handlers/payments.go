package handlers

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"

	"invesa_backend/internal/database"
	"invesa_backend/internal/utils"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// PhonePe Sandbox Credentials (Standard)
const (
	SandboxMerchantID = "PGTESTPAYUAT"
	SandboxSaltKey    = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399"
	SandboxSaltIndex  = "1"
	SandboxBaseURL    = "https://api-preprod.phonepe.com/apis/pg-sandbox"
)

// InitiatePayment constructs the PhonePe payload and returns the redirect URL
func InitiatePayment(c *gin.Context) {
	// 1. Get User
	currentUserStr, exists := c.Get("user_id")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}
	userID := currentUserStr.(int)

	// 2. Generate Transaction ID
	txnID := "TXN_" + uuid.New().String()

	// 3. Construct Payload
	payload := map[string]interface{}{
		"merchantId":            SandboxMerchantID,
		"merchantTransactionId": txnID,
		"merchantUserId":        fmt.Sprintf("USER_%d", userID),
		"amount":                100,                                                          // 100 paise = ₹1 (Test Amount)
		"redirectUrl":           "https://invesa-prod-he47.vercel.app/matches?status=success", // Minimal callback for MVP
		"redirectMode":          "REDIRECT",
		"callbackUrl":           "https://invesa-service.onrender.com/api/payment/callback", // S2S Callback
		"paymentInstrument": map[string]interface{}{
			"type": "PAY_PAGE",
		},
	}

	payloadBytes, _ := json.Marshal(payload)
	base64Payload := base64.StdEncoding.EncodeToString(payloadBytes)

	// 4. Generate Checksum (X-VERIFY)
	// SHA256(base64Payload + "/pg/v1/pay" + SaltKey) + "###" + SaltIndex
	dataToHash := base64Payload + "/pg/v1/pay" + SandboxSaltKey
	hash := sha256.Sum256([]byte(dataToHash))
	hashHex := hex.EncodeToString(hash[:])
	checksum := hashHex + "###" + SandboxSaltIndex

	// 5. Send Request to PhonePe
	reqBody, _ := json.Marshal(map[string]string{"request": base64Payload})
	req, _ := http.NewRequest("POST", SandboxBaseURL+"/pg/v1/pay", bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-VERIFY", checksum)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to connect to Payment Gateway")
		return
	}
	defer resp.Body.Close()

	var respMap map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&respMap)

	if success, ok := respMap["success"].(bool); ok && success {
		// Extract Redirect URL
		data := respMap["data"].(map[string]interface{})
		instrument := data["instrumentResponse"].(map[string]interface{})
		redirectInfo := instrument["redirectInfo"].(map[string]interface{})
		url := redirectInfo["url"].(string)

		// Create pending order record if we had an orders table (Skipping for MVP)
		utils.RespondWithJSON(c, http.StatusOK, gin.H{
			"url": url,
		})
	} else {
		utils.RespondWithError(c, http.StatusBadRequest, "Payment initiation failed")
	}
}

// PaymentCallback handles server-to-server updates
// For MVP demo, we blindly upgrade the user if they return to frontend UI
// But this endpoint exists to receive the webhook
func PaymentCallback(c *gin.Context) {
	// In production, you verify the X-VERIFY header here similar to the request logic
	// For now, this just logs payload
	var input map[string]interface{}
	c.ShouldBindJSON(&input)
	// TODO: Verify checksum and update order status
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// VerifySuccess (Called by frontend after successful redirect return)
// This is a "Mock" verification for the MVP since getting S2S verify working on local/sandbox needs public IPs
func VerifySuccess(c *gin.Context) {
	currentUserStr, exists := c.Get("user_id")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "User not authenticated")
		return
	}
	userID := currentUserStr.(int)

	_, err := database.DB.Exec(context.Background(), "UPDATE users SET is_premium = TRUE WHERE id = $1", userID)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update subscription status")
		return
	}
	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Premium Unlocked"})
}
