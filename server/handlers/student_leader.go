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
