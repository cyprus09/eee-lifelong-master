package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"bytes"
	"github.com/gin-gonic/gin"
	supa "github.com/supabase-community/supabase-go"
	"lifelong-eee-project/models"
	"io"
)

type UserHandler struct {
	client *supa.Client
	db     *sql.DB
}

// User profile structure matching the profiles table

func NewUserHandler(db *sql.DB) *UserHandler {
	supabaseUrl := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if supabaseUrl == "" || supabaseKey == "" {
		log.Fatal("Missing required Supabase environment variables")
	}

	log.Printf("Initializing Supabase client with URL: %s", supabaseUrl)

	client, err := supa.NewClient(supabaseUrl, supabaseKey, nil)
	if err != nil {
		log.Fatalf("Error initializing Supabase client: %v", err)
	}

	handler := &UserHandler{
		client: client,
		db:     db,
	}

	return handler
}

// Get all users (admin only)
func (h *UserHandler) GetUsers(c *gin.Context) {
	log.Printf("GetUsers called with token: %v", c.GetHeader("Authorization") != "")

	// First retrieve profiles
	profilesResult, _, err := h.client.From("profiles").
		Select("*", "", false).
		Execute()

	if err != nil {
		log.Printf("Error retrieving profiles: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var profiles []models.Profile
	if err := json.Unmarshal(profilesResult, &profiles); err != nil {
		log.Printf("Error unmarshaling profiles: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process profiles data"})
		return
	}

	// Get all users from Supabase Auth API
	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceRoleKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	req, err := http.NewRequest("GET",
		fmt.Sprintf("%s/auth/v1/admin/users", supabaseURL), nil)
	if err != nil {
		log.Printf("Error creating users request: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving user data"})
		return
	}

	// Set required headers
	req.Header.Set("apikey", serviceRoleKey)
	req.Header.Set("Authorization", "Bearer "+serviceRoleKey)

	// Make the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error fetching users: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving user data"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Error response from auth API: %d", resp.StatusCode)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user data"})
		return
	}

	// Parse the response
	var authResponse struct {
		Users []struct {
			ID    string `json:"id"`
			Email string `json:"email"`
		} `json:"users"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&authResponse); err != nil {
    log.Printf("Error decoding users response: %v", err)
    c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process user data"})
    return
}

	// Create a map for easy lookup
	emailMap := make(map[string]string)
	for _, user := range authResponse.Users {
		emailMap[user.ID] = user.Email
	}

	// Add emails to profiles
	for i, profile := range profiles {
		if email, ok := emailMap[profile.ID]; ok {
			profiles[i].Email = email
		}
	}

	log.Printf("Successfully retrieved %d users", len(profiles))
	c.JSON(http.StatusOK, profiles)
}

// Get a specific user (admin or self only)
func (h *UserHandler) GetUser(c *gin.Context) {
	userID := c.Param("id")
	requestingUserID := c.GetString("userId")
	requestingUserRole := c.GetString("userRole")

	// Only admins or the user themselves can view their profile
	if requestingUserRole != "admin" && requestingUserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized access"})
		return
	}

	// Get the profile
	result, _, err := h.client.From("profiles").
		Select("*", "", false).
		Filter("id", "eq", userID).
		Execute()

	if err != nil {
		log.Printf("Error retrieving profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var profiles []models.Profile
	if err := json.Unmarshal(result, &profiles); err != nil {
		log.Printf("Error unmarshaling profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process profile data"})
		return
	}

	if len(profiles) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	profile := profiles[0]

	// Get email from auth.users if admin
	if requestingUserRole == "admin" {
		userResult, _, err := h.client.From("auth.users").
			Select("email", "", false).
			Filter("id", "eq", profile.ID).
			Execute()

		if err == nil {
			var users []struct {
				Email string `json:"email"`
			}

			if err := json.Unmarshal(userResult, &users); err == nil && len(users) > 0 {
				profile.Email = users[0].Email
			}
		}
	}

	c.JSON(http.StatusOK, profile)
}

// Update a user (admin only)
func (h *UserHandler) UpdateUser(c *gin.Context) {
	userID := c.Param("id")
	requestingUserRole := c.GetString("userRole")

	// Only admins can update users
	if requestingUserRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only administrators can update user profiles"})
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Validate the role if it's being updated
	if role, exists := updateData["role"].(string); exists {
		validRoles := []string{"student", "student_leader", "admin"}
		isValidRole := false
		for _, validRole := range validRoles {
			if role == validRole {
				isValidRole = true
				break 
			}
		}

		if !isValidRole {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role specified"})
			return
		}
	}

	// Update the profile
	result, _, err := h.client.From("profiles").
		Update(updateData, "", "id").
		Eq("id", userID).
		Execute()

	if err != nil {
		log.Printf("Error updating profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to update user profile: %v", err)})
		return
	}

	var updatedProfiles []models.Profile
	if err := json.Unmarshal(result, &updatedProfiles); err != nil {
		log.Printf("Error unmarshaling updated profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process updated profile data"})
		return
	}

	if len(updatedProfiles) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	updatedProfile := updatedProfiles[0]

	// Get email from auth.users
	userResult, _, err := h.client.From("auth.users").
		Select("email", "", false).
		Filter("id", "eq", userID).
		Execute()

	if err == nil {
		var users []struct {
			Email string `json:"email"`
		}

		if err := json.Unmarshal(userResult, &users); err == nil && len(users) > 0 {
			updatedProfile.Email = users[0].Email
		}
	}

	c.JSON(http.StatusOK, updatedProfile)
}

// Update a user's notification preferences
func (h *UserHandler) UpdateNotificationPreferences(c *gin.Context) {
	userID := c.Param("id")
	requestingUserID := c.GetString("userId")
	requestingUserRole := c.GetString("userRole")

	// Only admins or the user themselves can update their notification preferences
	if requestingUserRole != "admin" && requestingUserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized access"})
		return
	}

	var requestData struct {
		NotificationPreferences models.NotificationPreferences `json:"notification_preferences"`
	}

	if err := c.ShouldBindJSON(&requestData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Convert notification preferences to JSON
	prefsJSON, err := json.Marshal(requestData.NotificationPreferences)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process notification preferences"})
		return
	}

	updateData := map[string]interface{}{
		"notification_preferences": json.RawMessage(prefsJSON),
	}

	// Update the profile
	result, _, err := h.client.From("profiles").
		Update(updateData, "", "id").
		Eq("id", userID).
		Execute()

	if err != nil {
		log.Printf("Error updating notification preferences: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to update notification preferences: %v", err)})
		return
	}

	var updatedProfiles []models.Profile
	if err := json.Unmarshal(result, &updatedProfiles); err != nil {
		log.Printf("Error unmarshaling updated profile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process updated profile data"})
		return
	}

	if len(updatedProfiles) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, updatedProfiles[0])
}

// Disable a user (admin only)
func (h *UserHandler) DisableUser(c *gin.Context) {
	userID := c.Param("id")
	requestingUserID := c.GetString("userId")
	requestingUserRole := c.GetString("userRole")

	// Only admins can disable users
	if requestingUserRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only administrators can disable users"})
		return
	}

	// Prevent self-disabling
	if requestingUserID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot disable your own account"})
		return
	}

	// Instead of using client.Auth.Admin, make a direct HTTP request
	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceRoleKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	// Create the request body
	banTime := time.Now().AddDate(100, 0, 0).Format(time.RFC3339) // Ban for 100 years
	updateBody := map[string]interface{}{
		"banned_until": banTime,
	}

	bodyJSON, err := json.Marshal(updateBody)
	if err != nil {
		log.Printf("Error creating request body: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error preparing disable request"})
		return
	}

	// Make the request to update the user
	req, err := http.NewRequest("PUT",
		fmt.Sprintf("%s/auth/v1/admin/users/%s", supabaseURL, userID),
		bytes.NewBuffer(bodyJSON))
	if err != nil {
		log.Printf("Error creating request: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating disable request"})
		return
	}

	// Set the required headers
	req.Header.Set("apikey", serviceRoleKey)
	req.Header.Set("Authorization", "Bearer "+serviceRoleKey)
	req.Header.Set("Content-Type", "application/json")

	// Make the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error making disable request: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to disable user: %v", err)})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("Error disabling user, status %d: %s", resp.StatusCode, string(bodyBytes))
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to disable user (status %d)", resp.StatusCode)})
		return
	}

	// Success, return response to client
	c.JSON(http.StatusOK, gin.H{"message": "User has been disabled successfully"})
}
