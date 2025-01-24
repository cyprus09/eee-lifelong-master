package handlers

import (
	"database/sql"
	"github.com/gin-gonic/gin"
	supa "github.com/supabase-community/supabase-go"
	"lifelong-eee-project/server/models"
	"log"
	"net/http"
	"os"
	"time"
	"encoding/json"
	"fmt"
)

type EventHandler struct {
	client *supa.Client
	db     *sql.DB
}

func NewEventHandler(db *sql.DB) *EventHandler {
	supabaseUrl := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_ANON_KEY")

	client, err := supa.NewClient(supabaseUrl, supabaseKey, nil)
	if err != nil {
		log.Fatalf("Error initializing Supabase client: %v", err)
	}
	return &EventHandler{
		client: client,
		db:     db,
	}
}

func (h *EventHandler) CreateEvent(c *gin.Context) {
	var event models.Event
	if err := c.BindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()
	event.CreatedAt = now
	event.UpdatedAt = now
	event.CreatedBy = c.GetString("userId")
	event.CurrentAttendees = 0

	_, _, err := h.client.From("events").Upsert(
		event,
		"id,title,description,event_date,venue,max_attendees,current_attendees,event_type,created_by,created_at,updated_at",
		"id",
		"*").Execute()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, event)
}

func (h *EventHandler) GetEvents(c *gin.Context) {
	eventType := c.Query("type")
	query := h.client.From("events").Select("*", "*", false)

	if eventType == "upcoming" {
		query = query.Filter("event_date", "gt", time.Now().Format(time.RFC3339))
	}

	_, contentStr, err := query.Execute()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var events []models.Event
	json.Unmarshal([]byte(fmt.Sprintf("%v", contentStr)), &events)
	c.JSON(http.StatusOK, events)
}

func (h *EventHandler) RegisterForEvent(c *gin.Context) {
	eventID := c.Param("id")
	userID := c.GetString("userId")

	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	var exists bool
	err = tx.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM event_registrations 
			WHERE event_id = $1 AND user_id = $2
		)`, eventID, userID).Scan(&exists)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check registration"})
		return
	}

	if exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already registered for this event"})
		return
	}

	var currentAttendees, maxAttendees int
	err = tx.QueryRow(`
		SELECT current_attendees, max_attendees 
		FROM events WHERE id = $1
	`, eventID).Scan(&currentAttendees, &maxAttendees)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get event details"})
		return
	}

	if maxAttendees > 0 && currentAttendees >= maxAttendees {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event is full"})
		return
	}

	registration := models.Registration{
		EventID: eventID,
		UserID:  userID,
	}

	_, _, err = h.client.From("event_registrations").Insert(&registration, true, "event_id, user_id", "event_id", "*").Execute()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register"})
		return
	}

	// Update attendee count using Supabase
	updateQuery := map[string]interface{}{
		"current_attendees": currentAttendees + 1,
	}
	_, _, err = h.client.From("events").Update(updateQuery, "current_attendees", "id").Eq("id", eventID).Execute()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update attendee count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully registered"})
}

func (h *EventHandler) GetRegisteredEvents(c *gin.Context) {
	userID := c.Param("userId")
	var events []models.Event

	query := `
		events(*),
		event_registrations!inner (
			user_id
		)
	`

	_, _, err := h.client.From("events").Select(query, "*", false).Filter("event_registrations.user_id", "eq", userID).Execute()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, events)
}

func (h *EventHandler) UpdatePastEvents() {
	updateQuery := map[string]interface{}{
		"event_type": "past",
	}
	_, _, err := h.client.From("events").Update(updateQuery, "event_type", "event_date").Filter("event_date", "lt", time.Now().Format(time.RFC3339)).Execute()
	if err != nil {
		log.Printf("Error updating past events: %v", err)
	}
}
