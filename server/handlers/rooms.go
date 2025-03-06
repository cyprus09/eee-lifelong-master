package handlers

import (
	"encoding/json"
	"fmt"
	"lifelong-eee-project/models"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/supabase-community/postgrest-go"
)

func (h *EventHandler) GetAvailableRooms(c *gin.Context) {
	log.Printf("GetAvailableRooms called with token: %v", c.GetHeader("Authorization") != "")

	// Get query parameters
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

	// Get time parameters (optional, default to full day)
	startTime := c.Query("start_time")
	endTime := c.Query("end_time")

	// Default time range if not provided
	if startTime == "" {
		startTime = "00:00"
	}
	if endTime == "" {
		endTime = "23:59"
	}

	// Parse capacity filter (optional)
	minCapacity := 0
	if capacityStr := c.Query("min_capacity"); capacityStr != "" {
		minCapacity, err = strconv.Atoi(capacityStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid minimum capacity"})
			return
		}
	}

	roomType := c.Query("room_type")

	log.Printf("Fetching rooms with filters: date=%s, time=%s-%s, minCapacity=%d, roomType=%s",
		date, startTime, endTime, minCapacity, roomType)

	roomsQuery := h.client.From("rooms").Select("*", "", false)

	if minCapacity > 0 {
		roomsQuery = roomsQuery.Filter("capacity", "gte", fmt.Sprint(minCapacity))
	}

	if roomType != "" {
		roomsQuery = roomsQuery.Filter("room_type", "eq", roomType)
	}

	roomsResult, count, err := roomsQuery.Execute()
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

	startDateTime := fmt.Sprintf("%sT%s:00Z", date, startTime)
	endDateTime := fmt.Sprintf("%sT%s:00Z", date, endTime)

	log.Printf("Fetching events for time range: %s to %s", startDateTime, endDateTime)

	eventsQuery := h.client.From("events").
		Select("*", "", false).
		Filter("status", "eq", "upcoming").
		Order("event_date", &postgrest.OrderOpts{Ascending: true})

	// This is a complex time range query
	// Need to fetch events that overlap with our desired time slot:
	// 1. Events starting on our date
	// 2. Events already in progress during our time window
	eventsQuery = eventsQuery.Or(fmt.Sprintf("event_date.gte.%s,event_date.lt.%s",
	eventsQuery = eventsQuery.Or(fmt.Sprintf("event_date.gte.%s,event_date.lt.%s",
		startDateTime, endDateTime), "")
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

	// Create a map of booked rooms
	bookedRooms := make(map[string]bool)
	for _, event := range events {
		// Check if this event overlaps with the requested time slot
		eventTime, _ := time.Parse(time.RFC3339, event.EventDate)

		// We consider an event to be 2 hours long by default if duration is not specified
		// This can be modified to use the actual event duration once that field is added
		eventEndTime := eventTime.Add(2 * time.Hour)

		requestedStartTime, _ := time.Parse(time.RFC3339, startDateTime)
		requestedEndTime, _ := time.Parse(time.RFC3339, endDateTime)

		// Check for overlap
		if (eventTime.Before(requestedEndTime) || eventTime.Equal(requestedEndTime)) &&
			(eventEndTime.After(requestedStartTime) || eventEndTime.Equal(requestedStartTime)) {
			bookedRooms[event.Venue] = true
		}
	}

	// Filter only available rooms
	var availableRooms []models.Room
	for _, room := range rooms {
		if !bookedRooms[room.Name] {
			availableRooms = append(availableRooms, room)
		}
	}

	log.Printf("Found %d available rooms out of %d total rooms", len(availableRooms), len(rooms))
	c.JSON(http.StatusOK, availableRooms)
}

// GetRooms returns all rooms without availability information
func (h *EventHandler) GetRooms(c *gin.Context) {
	log.Printf("GetRooms called with token: %v", c.GetHeader("Authorization") != "")

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

	c.JSON(http.StatusOK, rooms)
}
