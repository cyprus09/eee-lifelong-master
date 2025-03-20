package handlers

import (
	"encoding/json"
	"github.com/gin-gonic/gin"
	"lifelong-eee-project/models"
	"log"
	"net/http"
)

func (h *EventHandler) GetEventAttendees(c *gin.Context) {
	eventID := c.Param("id")
	userRole := c.GetString("userRole")

	if userRole != "student_leader" && userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only student leaders and can view attendee details"})
		return
	}

	log.Printf("Fetching attendees for event: %s", eventID)

	var events []models.Event
	eventResult, _, err := h.client.From("events").
		Select("*", "", false).
		Filter("id", "eq", eventID).
		Execute()

	if err != nil {
		log.Printf("Error fetching event details: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify event"})
		return
	}

	if err := json.Unmarshal(eventResult, &events); err != nil {
		log.Printf("Error unmarshaling event: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process event data"})
		return
	}

	if len(events) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
		return
	}

	query := `
		SELECT 
				er.id,
				er.user_id,
				er.registration_date,
				SPLIT_PART(au.email, '@', 1) AS name,
				au.email
		FROM 
				event_registrations er
		JOIN
				auth.users au ON er.user_id = au.id
		WHERE 
				er.event_id = $1
		ORDER BY
				er.registration_date DESC
`

	rows, err := h.db.Query(query, eventID)
	if err != nil {
		log.Printf("Error querying attendees: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attendees"})
		return
	}
	defer rows.Close()

	var attendees []models.AttendeesResponse
	for rows.Next() {
		var attendee models.AttendeesResponse
		var name, email *string

		if err := rows.Scan(
			&attendee.ID,
			&attendee.UserID,
			&attendee.RegistrationDate,
			&name,
			&email,
		); err != nil {
			log.Printf("Error scanning attendee row: %v", err)
			continue
		}

		if name != nil {
			attendee.Name = *name
		} else {
			attendee.Name = "Unknown"
		}

		if email != nil {
			attendee.Email = *email
		} else {
			attendee.Email = "No email provided"
		}

		attendees = append(attendees, attendee)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error iterating through rows: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error processing attendees"})
		return
	}

	log.Printf("Successfully fetched %d attendees for event %s", len(attendees), eventID)
	c.JSON(http.StatusOK, attendees)
}

func (h *EventHandler) GetEventStats(c *gin.Context) {
	userID := c.GetString("userId")
	userRole := c.GetString("userRole")

	if userRole != "student_leader" && userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only student leaders and admins can view statistics"})
		return
	}

	log.Printf("Fetching event statistics for user: %s", userID)

	var createdByFilter string
	var args []interface{}

	if userRole == "admin" {
		createdByFilter = ""
		args = []interface{}{}
	} else {
		createdByFilter = "WHERE e.created_by = $1"
		args = []interface{}{userID}
	}

	query := `
		SELECT
			COUNT(*) AS total_events,
			SUM(CASE WHEN e.status = 'upcoming' THEN 1 ELSE 0 END) AS upcoming_events,
			SUM(CASE WHEN e.status = 'past' THEN 1 ELSE 0 END) AS past_events,
			SUM(CASE WHEN e.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_events,
			SUM(e.current_attendees) AS total_registrations,
			(
				SELECT e2.event_type
				FROM events e2
				` + createdByFilter + `
				GROUP BY e2.event_type
				ORDER BY COUNT(*) DESC
				LIMIT 1
			) AS most_popular_type
		FROM
			events e
		` + createdByFilter

	var stats struct {
		TotalEvents        int    `json:"total_events"`
		UpcomingEvents     int    `json:"upcoming_events"`
		PastEvents         int    `json:"past_events"`
		CancelledEvents    int    `json:"cancelled_events"`
		TotalRegistrations int    `json:"total_registrations"`
		MostPopularType    string `json:"most_popular_type"`
	}

	err := h.db.QueryRow(query, args...).Scan(
		&stats.TotalEvents,
		&stats.UpcomingEvents,
		&stats.PastEvents,
		&stats.CancelledEvents,
		&stats.TotalRegistrations,
		&stats.MostPopularType,
	)

	if err != nil {
		log.Printf("Error fetching event statistics: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch statistics"})
		return
	}

	mostPopularQuery := `
		SELECT
			e.id,
			e.title,
			e.event_type,
			e.event_date,
			e.current_attendees,
			e.max_attendees,
			e.venue
		FROM
			events e
		` + createdByFilter + `
		ORDER BY
			e.current_attendees DESC
		LIMIT 1
	`

	var mostPopularEvent models.Event
	err = h.db.QueryRow(mostPopularQuery, args...).Scan(
		&mostPopularEvent.ID,
		&mostPopularEvent.Title,
		&mostPopularEvent.EventType,
		&mostPopularEvent.EventDate,
		&mostPopularEvent.CurrentAttendees,
		&mostPopularEvent.MaxAttendees,
		&mostPopularEvent.Venue,
	)

	if err != nil && err.Error() != "sql: no rows in result set" {
		log.Printf("Error fetching most popular event: %v", err)
	} else if err == nil {
		statsResponse := map[string]interface{}{
			"total_events":        stats.TotalEvents,
			"upcoming_events":     stats.UpcomingEvents,
			"past_events":         stats.PastEvents,
			"cancelled_events":    stats.CancelledEvents,
			"total_registrations": stats.TotalRegistrations,
			"most_popular_type":   stats.MostPopularType,
			"most_popular_event":  mostPopularEvent,
		}

		c.JSON(http.StatusOK, statsResponse)
		return
	}

	c.JSON(http.StatusOK, stats)
}
