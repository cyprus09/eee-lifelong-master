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

	// Parse capacity filter (optional)
	minCapacity := 0
	if capacityStr := c.Query("min_capacity"); capacityStr != "" {
		minCapacity, err = strconv.Atoi(capacityStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid minimum capacity"})
			return
		}
	}

	// Get room type filter (optional)
	roomType := c.Query("room_type")

	log.Printf("Fetching rooms with filters: date=%s, minCapacity=%d, roomType=%s",
		date, minCapacity, roomType)

	// Fetch all rooms
	roomsQuery := h.client.From("rooms").Select("*", "", false)

	if minCapacity > 0 {
		roomsQuery = roomsQuery.Filter("capacity", "gte", fmt.Sprint(minCapacity))
	}

	// Apply room type filter if specified
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

	// Create a map of booked rooms
	bookedRooms := make(map[string]bool)
	for _, event := range events {
		bookedRooms[event.Venue] = true
	}

	// Filter only available rooms
	var availableRooms []models.Room
	for _, room := range rooms {
		if !bookedRooms[room.Name] {
			availableRooms = append(availableRooms, room)
		}
	}

	log.Printf("Found %d available rooms out of %d total rooms", len(availableRooms), len(rooms))
	log.Printf("Available rooms: %+v", rooms)
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
