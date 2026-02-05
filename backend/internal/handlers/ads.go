package handlers

import (
	"invesa_backend/internal/database"
	"invesa_backend/internal/models"
	"invesa_backend/internal/utils"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type AdQuoteRequest struct {
	Placement    string   `json:"placement" binding:"required"`
	Categories   []string `json:"categories"`
	Locations    []string `json:"locations"`
	DurationDays int      `json:"duration_days"`
}

type AdCreateRequest struct {
	AdvertiserName string   `json:"advertiser_name" binding:"required"`
	ContactEmail   string   `json:"contact_email" binding:"required,email"`
	Placement      string   `json:"placement" binding:"required"`
	Headline       string   `json:"headline"`
	CtaURL         string   `json:"cta_url"`
	Categories     []string `json:"categories"`
	Locations      []string `json:"locations"`
	DurationDays   int      `json:"duration_days"`
	Message        string   `json:"message"`
}

type AdQuoteResponse struct {
	PriceINR int    `json:"price_inr"`
	Notes    string `json:"notes"`
}

func QuoteAd(c *gin.Context) {
	var input AdQuoteRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request")
		return
	}

	price := calculateAdPrice(input.Placement, input.Categories, input.Locations, input.DurationDays)
	utils.RespondWithJSON(c, http.StatusOK, AdQuoteResponse{
		PriceINR: price,
		Notes:    "Manual payment for now. Your ad goes live after confirmation.",
	})
}

func CreateAd(c *gin.Context) {
	var input AdCreateRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid request")
		return
	}

	price := calculateAdPrice(input.Placement, input.Categories, input.Locations, input.DurationDays)
	requirements := buildRequirements(input.Categories, input.Locations, input.DurationDays, input.Message)

	_, err := database.DB.Exec(c, `
		INSERT INTO ad_campaigns (advertiser_name, contact_email, placement, headline, cta_url, requirements, price_inr, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)`,
		input.AdvertiserName, input.ContactEmail, input.Placement, input.Headline, input.CtaURL, requirements, price, time.Now(),
	)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to create ad campaign")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{
		"message":   "Ad request submitted. Payment required to activate.",
		"price_inr": price,
		"status":    "pending",
	})
}

func ListAds(c *gin.Context) {
	placement := c.Query("placement")
	if placement == "" {
		placement = "home"
	}

	rows, err := database.DB.Query(c, `
		SELECT id, advertiser_name, placement, headline, cta_url, requirements, price_inr, status, starts_at, ends_at, created_at
		FROM ad_campaigns
		WHERE status = 'active' AND placement = $1
		ORDER BY created_at DESC
		LIMIT 10`, placement)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to fetch ads")
		return
	}
	defer rows.Close()

	var ads []models.AdCampaign
	for rows.Next() {
		var ad models.AdCampaign
		if err := rows.Scan(&ad.ID, &ad.Advertiser, &ad.Placement, &ad.Headline, &ad.CtaURL, &ad.Requirements, &ad.PriceINR, &ad.Status, &ad.StartsAt, &ad.EndsAt, &ad.CreatedAt); err != nil {
			continue
		}
		ad.ContactEmail = ""
		ads = append(ads, ad)
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"items": ads})
}

func AdminListAds(c *gin.Context) {
	rows, err := database.DB.Query(c, `
		SELECT id, advertiser_name, contact_email, placement, headline, cta_url, requirements, price_inr, status, starts_at, ends_at, created_at
		FROM ad_campaigns
		ORDER BY created_at DESC
		LIMIT 100`)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to fetch ads")
		return
	}
	defer rows.Close()

	var ads []models.AdCampaign
	for rows.Next() {
		var ad models.AdCampaign
		if err := rows.Scan(&ad.ID, &ad.Advertiser, &ad.ContactEmail, &ad.Placement, &ad.Headline, &ad.CtaURL, &ad.Requirements, &ad.PriceINR, &ad.Status, &ad.StartsAt, &ad.EndsAt, &ad.CreatedAt); err != nil {
			continue
		}
		ads = append(ads, ad)
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"items": ads})
}

func AdminMarkPaid(c *gin.Context) {
	id := c.Param("id")
	now := time.Now()

	_, err := database.DB.Exec(c, `
		UPDATE ad_campaigns
		SET status = 'active', starts_at = $1
		WHERE id = $2`, now, id)
	if err != nil {
		utils.RespondWithError(c, http.StatusInternalServerError, "Failed to update ad status")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, gin.H{"message": "Ad activated"})
}

func calculateAdPrice(placement string, categories, locations []string, durationDays int) int {
	base := 500
	if placement == "matches" {
		base = 800
	}
	if durationDays <= 0 {
		durationDays = 7
	}
	categoryCost := 200 * len(categories)
	locationCost := 150 * len(locations)
	durationCost := 50 * durationDays

	return base + categoryCost + locationCost + durationCost
}

func buildRequirements(categories, locations []string, durationDays int, message string) string {
	parts := []string{}
	if len(categories) > 0 {
		parts = append(parts, "categories:"+strings.Join(categories, ","))
	}
	if len(locations) > 0 {
		parts = append(parts, "locations:"+strings.Join(locations, ","))
	}
	if durationDays > 0 {
		parts = append(parts, "duration_days:"+strconv.Itoa(durationDays))
	}
	if message != "" {
		parts = append(parts, "note:"+message)
	}
	return strings.Join(parts, "|")
}
