package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"lifelong-eee-project/models"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/gin-gonic/gin"
	postgrest "github.com/supabase-community/postgrest-go"
	supa "github.com/supabase-community/supabase-go"
)

type EventHandler struct {
	client *supa.Client
	db     *sql.DB
}

func (h *EventHandler) checkSupabaseConnection() error {
	// Try a simple query to test the connection
	result, _, err := h.client.From("events").
		Select("count", "*", false).
		Execute()

	if err != nil {
		return fmt.Errorf("failed to connect to Supabase: %v", err)
	}

	log.Printf("Supabase connection test result: %v", result)
	return nil
}

func NewEventHandler(db *sql.DB) *EventHandler {
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

	handler := &EventHandler{
		client: client,
		db:     db,
	}

	// Test the connection
	if err := handler.checkSupabaseConnection(); err != nil {
		log.Printf("Warning: Supabase connection check failed: %v", err)
	}

	return handler
}

func (h *EventHandler) CreateEvent(c *gin.Context) {
	var event models.Event
	if err := c.BindJSON(&event); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	event.ID = uuid.New().String()

	// Set default values
	now := time.Now()
	event.CreatedAt = now
	event.UpdatedAt = now
	event.CreatedBy = c.GetString("userId")
	event.CurrentAttendees = 0
	event.Status = "upcoming"

	// Log the event creation attempt
	log.Printf("Attempting to create event: %+v", event)

	result, _, err := h.client.From("events").Insert(&event, false, "*", "", "*").Execute()

	log.Printf("Insert result: %+v", result)

	if err != nil {
		log.Printf("Error creating event: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create event: %v", err)})
		return
	}

	var createdEvents []models.Event
	if err := json.Unmarshal(result, &createdEvents); err != nil {
		log.Printf("Error unmarshaling created event: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process created event"})
		return
	}

	if len(createdEvents) == 0 {
		log.Printf("No event was created")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No event was created"})
		return
	}

	createdEvent := createdEvents[0]
	log.Printf("Event created successfully with ID: %s", createdEvent.ID)
	c.JSON(http.StatusCreated, createdEvent)

	log.Printf("Event created successfully with ID: %s", event.ID)
	c.JSON(http.StatusCreated, event)
}

func (h *EventHandler) UpdatePastEvents() error {
	updateQuery := map[string]interface{}{
		"status": "past",
	}
	_, _, err := h.client.From("events").
		Update(updateQuery, "status", "id").
		Filter("event_date", "lt", time.Now().Format(time.RFC3339)).
		Filter("status", "eq", "upcoming").
		Execute()

	if err != nil {
		log.Printf("Error updating past events: %v", err)
		return err
	}
	return nil
}

func (h *EventHandler) GetEvents(c *gin.Context) {
	log.Printf("GetEvents called with token: %v", c.GetHeader("Authorization") != "")

	eventStatus := c.Query("status")
	log.Printf("Event status filter: %s", eventStatus)

	// Basic select with all needed fields
	query := h.client.From("events").Select("*", "", false)
	log.Printf("Raw query: %+v", query)

	// Debug current time
	now := time.Now().Format(time.RFC3339)
	log.Printf("Query params: type=%s now=%s", eventStatus, now)

	// Add filters based on type
	switch eventStatus {
	case "upcoming":
		query = query.Filter("event_date", "gt", now).Filter("status", "eq", "upcoming").Order("event_date", &postgrest.OrderOpts{Ascending: true})
	case "past":
		query = query.Filter("event_date", "lt", now).Filter("status", "eq", "past").Order("event_date", &postgrest.OrderOpts{Ascending: false})
	case "cancelled":
		query = query.Filter("status", "eq", "cancelled")
	}

	// Execute query and get results
	result, _, err := query.Execute()
	if err != nil {
		log.Printf("Error executing query: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Query result: %s", string(result))

	// Try to unmarshal the response
	var events []models.Event
	if err := json.Unmarshal(result, &events); err != nil {
		log.Printf("Error unmarshaling events: %v", err)
		log.Printf("JSON being unmarshaled: %s", string(result))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process events data"})
		return
	}

	// Log success and return results
	log.Printf("Successfully retrieved %d events", len(events))

	c.JSON(http.StatusOK, events)
}

func (h *EventHandler) RegisterForEvent(c *gin.Context) {
	eventID := c.Param("id")
	userID := c.GetString("userId")

	log.Printf("Attempting to register user %s for event %s", userID, eventID)

	client := h.client

	// Check if already registered
	var registrations []models.Registration
	result, _, err := client.From("event_registrations").
		Select("*", "", false).
		Filter("event_id", "eq", eventID).
		Filter("user_id", "eq", userID).
		Execute()

	if err != nil {
		log.Printf("Error checking registration: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check registration"})
		return
	}

	if err := json.Unmarshal(result, &registrations); err != nil {
		log.Printf("Error unmarshaling registrations: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process registration data"})
		return
	}

	if len(registrations) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already registered for this event"})
		return
	}

	// Get event details
	var events []models.Event
	result, _, err = h.client.From("events").
		Select("*", "", false).
		Filter("id", "eq", eventID).
		Execute()

	if err != nil {
		log.Printf("Error fetching event details: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get event details"})
		return
	}

	if err := json.Unmarshal(result, &events); err != nil {
		log.Printf("Error unmarshaling event details: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process event data"})
		return
	}

	if len(events) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	event := events[0]
	if event.MaxAttendees > 0 && event.CurrentAttendees >= event.MaxAttendees {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event is full"})
		return
	}

	// Register for event
	registration := models.Registration{
		ID:               uuid.New().String(),
		EventID:          eventID,
		UserID:           userID,
		RegistrationDate: time.Now().UTC(),
	}

	result, _, err = h.client.From("event_registrations").
		Insert(registration, false, "*", "", "*").
		Execute()

	if err != nil {
		log.Printf("Error registering for event: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register"})
		return
	}

	log.Printf("Raw response to Supabase: %s", string(result))

	// Update attendee count
	updateQuery := map[string]interface{}{
		"current_attendees": event.CurrentAttendees + 1,
	}

	_, _, err = h.client.From("events").Update(updateQuery, "current_attendees", "id").Eq("id", eventID).Execute()

	if err != nil {
		log.Printf("Error updating attendee count: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update attendee count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully registered"})
}

func (h *EventHandler) GetRegisteredEvents(c *gin.Context) {
	userID := c.Param("userId")
	log.Printf("Fetching registered events for user: %s", userID)

	// First get the event IDs from registrations
	regResult, _, err := h.client.From("event_registrations").
		Select("event_id", "", false).
		Filter("user_id", "eq", userID).
		Execute()

	if err != nil {
		log.Printf("Error fetching registrations: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Parse registration results to get event IDs
	var registrations []struct {
		EventID string `json:"event_id"`
	}
	if err := json.Unmarshal(regResult, &registrations); err != nil {
		log.Printf("Error unmarshaling registrations: %v", err)
		return
	}

	// Extract event IDs
	eventIDs := make([]string, len(registrations))
	for i, reg := range registrations {
		eventIDs[i] = reg.EventID
	}

	if len(eventIDs) == 0 {
		// Return empty array if no registrations
		c.JSON(http.StatusOK, []models.Event{})
		return
	}

	// Now fetch the events using the event IDs
	result, _, err := h.client.From("events").
		Select("*", "", false).
		Filter("id", "in", fmt.Sprintf("(%s)", strings.Join(eventIDs, ","))).
		Execute()

	if err != nil {
		log.Printf("Error fetching events: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Raw response from Supabase: %s", string(result))

	var events []models.Event
	if err := json.Unmarshal(result, &events); err != nil {
		log.Printf("Error unmarshaling events: %v", err)
		log.Printf("JSON being unmarshaled: %s", string(result))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process events data"})
		return
	}

	// Debug logging
	log.Printf("Processed %d events", len(events))
	for i, event := range events {
		log.Printf("Event %d: ID=%s, Title=%s", i+1, event.ID, event.Title)
	}

	c.JSON(http.StatusOK, events)
}

func (h *EventHandler) CancelEvent(c *gin.Context) {
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}

	var status string
	err := h.db.QueryRow("SELECT status FROM events WHERE id = $1", eventID).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check event status"})
		return
	}

	if status != "upcoming" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only upcoming events can be cancelled"})
		return
	}

	userRole := c.GetString("userRole")
	if userRole != "student_leader" && userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only student leaders can cancel events"})
		return
	}

	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	_, err = tx.Exec(`
			UPDATE events 
			SET status = 'cancelled', 
					updated_at = NOW() 
			WHERE id = $1 
			AND status = 'upcoming'`,
		eventID)
	if err != nil {
		log.Printf("Error cancelling event: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cancel event"})
		return
	}

	if err := tx.Commit(); err != nil {
		log.Printf("Error committing transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit changes"})
		return
	}

	result, _, err := h.client.From("events").
		Update(map[string]interface{}{
			"status":     "cancelled",
			"updated_at": time.Now(),
		}, "", "").
		Eq("id", eventID).
		Execute()

	if err != nil {
		log.Printf("Error updating event in Supabase: %v", err)
	}

	log.Printf("Successfully cancelled event %s: %s", eventID, string(result))
	c.JSON(http.StatusOK, gin.H{"message": "Event cancelled successfully"})
}
