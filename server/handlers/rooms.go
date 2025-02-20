package handlers

import (
	"encoding/json"
	"lifelong-eee-project/models"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/supabase-community/postgrest-go"
)

func (h *EventHandler) GetRoomAvailability(c *gin.Context) {
	log.Printf("GetRoomAvailability called with token: %v", c.GetHeader("Authorization") != "")

	date := c.Query("date")
	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Date parameter is required"})
		return
	}

	// Parse the date
	requestedDate, err := time.Parse("2006-01-02", date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	log.Printf("Fetching rooms from Supabase...")
	roomsResult, count, err := h.client.From("rooms").Select("*", "", false).Execute()
	if err != nil {
		log.Printf("Error fetching rooms: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rooms"})
		return
	}
	log.Printf("Fetched %d rooms", count)

	var rooms []models.Room
	if err := json.Unmarshal(roomsResult, &rooms); err != nil {
		log.Printf("Error unmarshaling rooms: %v", err)
		log.Printf("JSON being unmarshaled: %s", string(roomsResult))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process rooms data"})
		return
	}

	// Get events for the specified date
	startOfDay := requestedDate.Format("2006-01-02T00:00:00Z")
	endOfDay := requestedDate.Add(24 * time.Hour).Format("2006-01-02T00:00:00Z")

	log.Printf("Fetching events for date range: %s to %s", startOfDay, endOfDay)
	eventsQuery := h.client.From("events").
		Select("*", "", false).
		Filter("status", "eq", "upcoming").
		Filter("event_date", "gte", startOfDay).
		Filter("event_date", "lt", endOfDay).
		Order("event_date", &postgrest.OrderOpts{Ascending: true})

	eventsResult, _, err := eventsQuery.Execute()
	if err != nil {
		log.Printf("Error fetching events: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch events"})
		return
	}

	var events []models.Event
	if err := json.Unmarshal(eventsResult, &events); err != nil {
		log.Printf("Error unmarshaling events: %v", err)
		log.Printf("JSON being unmarshaled: %s", string(eventsResult))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process events data"})
		return
	}

	// Build room availability response
	availability := make([]models.RoomAvailability, len(rooms))
	for i, room := range rooms {
		roomEvents := make([]models.Event, 0)
		isAvailable := true

		for _, event := range events {
			if event.Venue == room.Name {
				roomEvents = append(roomEvents, event)
				isAvailable = false
			}
		}

		availability[i] = models.RoomAvailability{
			Room:      room,
			Available: isAvailable,
			Events:    roomEvents,
		}
	}

	log.Printf("Successfully processed %d rooms and %d events", len(rooms), len(events))
	c.JSON(http.StatusOK, availability)
}
