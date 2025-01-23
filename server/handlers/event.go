package handlers

import (
	"database/sql"
	"github.com/gin-gonic/gin"
	"lifelong-eee-project/server/models"
	"log"
	"net/http"
)

type EventHandler struct {
	db *sql.DB
}

func NewEventHandler(db *sql.DB) *EventHandler {
	return &EventHandler{db: db}
}

func (h *EventHandler) CreateEvent(c *gin.Context) {
	var event models.Event
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userRole := c.GetString("userRole")
	if userRole != "student_leader" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only student leaders can create events"})
		return
	}

	// Create event implementation
	_, err := h.db.Exec(`
			INSERT INTO events (title, description, event_date, venue, 
												max_attendees, event_type, created_by)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id`,
		event.Title, event.Description, event.EventDate, event.Venue,
		event.MaxAttendees, event.EventType, c.GetString("userId"))

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Event created successfully"})
}

func (h *EventHandler) GetEvents(c *gin.Context) {
	eventType := c.DefaultQuery("type", "upcoming")

	query := `
        SELECT id, title, description, event_date, venue, 
               max_attendees, current_attendees, event_type, 
               created_by, created_at, updated_at 
        FROM events
        WHERE event_type = $1
        ORDER BY event_date
    `

	rows, err := h.db.Query(query, eventType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var events []models.Event
	for rows.Next() {
		var e models.Event
		err := rows.Scan(&e.ID, &e.Title, &e.Description, &e.EventDate,
			&e.Venue, &e.MaxAttendees, &e.CurrentAttendees,
			&e.EventType, &e.CreatedBy, &e.CreatedAt, &e.UpdatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		events = append(events, e)
	}

	c.JSON(http.StatusOK, events)
}

func (h *EventHandler) GetRegisteredEvents(c *gin.Context) {
	userID := c.Param("userId")

	query := `
        SELECT e.* FROM events e
        INNER JOIN event_registrations er ON e.id = er.event_id
        WHERE er.user_id = $1
        ORDER BY e.event_date
    `

	rows, err := h.db.Query(query, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var events []models.Event
	for rows.Next() {
		var e models.Event
		err := rows.Scan(&e.ID, &e.Title, &e.Description, &e.EventDate,
			&e.Venue, &e.MaxAttendees, &e.CurrentAttendees,
			&e.EventType, &e.CreatedBy, &e.CreatedAt, &e.UpdatedAt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		events = append(events, e)
	}

	c.JSON(http.StatusOK, events)
}

func (h *EventHandler) RegisterForEvent(c *gin.Context) {
	eventID := c.Param("id")
	userID := c.GetString("userId")

	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User must be logged in to register"})
		return
	}

	// Check event capacity
	var maxAttendees, currentAttendees int
	err := h.db.QueryRow(`
				SELECT max_attendees, current_attendees
				FROM events WHERE id = $1`, eventID).Scan(&maxAttendees, &currentAttendees)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var count int
	err = tx.QueryRow(`
				SELECT COUNT(*) FROM event_registrations
				WHERE event_id = $1 AND user_id=$2`, eventID).Scan(&count)

	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if count > 0 {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Already registered!"})
		return
	}

	// Register user and update attendee count
	_, err = tx.Exec(`
        INSERT INTO event_registrations (event_id, user_id)
        VALUES ($1, $2)
    `, eventID, userID)

	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_, err = tx.Exec(`
        UPDATE events 
        SET current_attendees = current_attendees + 1
        WHERE id = $1
    `, eventID)

	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully registered"})
}

func UpdatePastEvents(db *sql.DB) {
	_, err := db.Exec(`
        UPDATE events 
        SET event_type = 'past'
        WHERE event_date < NOW()
    `)
	if err != nil {
		log.Printf("Error updating past events: %v", err)
	}
}
