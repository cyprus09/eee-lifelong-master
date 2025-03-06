package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"lifelong-eee-project/models"
	"log"
	"net/http"

	"time"

	"github.com/google/uuid"

	"github.com/gin-gonic/gin"
)

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

func (h *EventHandler) EditEvent(c *gin.Context) {
	eventID := c.Param("id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Event ID is required"})
		return
	}

	var currentEvent models.Event
	err := h.db.QueryRow(`
		SELECT id, title, description, event_date, venue, max_attendees, 
		       current_attendees, event_type, created_by, status 
		FROM events WHERE id = $1`, eventID).Scan(
		&currentEvent.ID, &currentEvent.Title, &currentEvent.Description,
		&currentEvent.EventDate, &currentEvent.Venue, &currentEvent.MaxAttendees,
		&currentEvent.CurrentAttendees, &currentEvent.EventType, &currentEvent.CreatedBy,
		&currentEvent.Status,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
			return
		}
		log.Printf("Error fetching event: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch event details"})
		return
	}

	if currentEvent.Status != "upcoming" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only upcoming events can be edited"})
		return
	}

	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	if currentEvent.CreatedBy != userID && userRole != "student_leader" {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to edit this event"})
		return
	}

	var updatedEvent models.Event
	if err := c.BindJSON(&updatedEvent); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if updatedEvent.MaxAttendees < currentEvent.CurrentAttendees {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Maximum attendees cannot be less than current attendees"})
		return
	}

	updateFields := map[string]interface{}{
		"title":         updatedEvent.Title,
		"description":   updatedEvent.Description,
		"event_date":    updatedEvent.EventDate,
		"venue":         updatedEvent.Venue,
		"max_attendees": updatedEvent.MaxAttendees,
		"event_type":    updatedEvent.EventType,
		"updated_at":    time.Now(),
	}

	tx, err := h.db.Begin()
	if err != nil {
		log.Printf("Error starting transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer func() {
		if err := tx.Rollback(); err != nil && err != sql.ErrTxDone {
			log.Printf("Error rolling back transaction: %v", err)
		}
	}()

	// Update the event in the database
	_, err = tx.Exec(`
		UPDATE events 
		SET title = $1, 
			description = $2, 
			event_date = $3, 
			venue = $4, 
			max_attendees = $5, 
			event_type = $6, 
			updated_at = $7
		WHERE id = $8 
		AND status = 'upcoming'`,
		updatedEvent.Title,
		updatedEvent.Description,
		updatedEvent.EventDate,
		updatedEvent.Venue,
		updatedEvent.MaxAttendees,
		updatedEvent.EventType,
		time.Now(),
		eventID,
	)

	if err != nil {
		log.Printf("Error updating event: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update event"})
		return
	}

	if err := tx.Commit(); err != nil {
		log.Printf("Error committing transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit changes"})
		return
	}

	result, _, err := h.client.From("events").
		Update(updateFields, "", "").
		Eq("id", eventID).
		Execute()

	if err != nil {
		log.Printf("Error updating event in Supabase: %v", err)
	}

	log.Printf("Successfully updated event %s: %s", eventID, string(result))

	var updatedEventResponse models.Event
	err = h.db.QueryRow(`
		SELECT id, title, description, event_date, venue, max_attendees, 
		       current_attendees, event_type, created_by, created_at, updated_at, status 
		FROM events WHERE id = $1`, eventID).Scan(
		&updatedEventResponse.ID, &updatedEventResponse.Title, &updatedEventResponse.Description,
		&updatedEventResponse.EventDate, &updatedEventResponse.Venue, &updatedEventResponse.MaxAttendees,
		&updatedEventResponse.CurrentAttendees, &updatedEventResponse.EventType, &updatedEventResponse.CreatedBy,
		&updatedEventResponse.CreatedAt, &updatedEventResponse.UpdatedAt, &updatedEventResponse.Status,
	)

	if err != nil {
		log.Printf("Error fetching updated event: %v", err)
		c.JSON(http.StatusOK, gin.H{"message": "Event updated successfully", "id": eventID})
		return
	}

	c.JSON(http.StatusOK, updatedEventResponse)
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
