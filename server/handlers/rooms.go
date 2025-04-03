package handlers

import (
	"encoding/json"
	"fmt"
	"lifelong-eee-project/models"
	"log"
	"net/http"
	"strconv"
	"time"

	"database/sql"
	"github.com/gin-gonic/gin"
	supa "github.com/supabase-community/supabase-go"
	"os"
	"strings"
)

type RoomHandler struct {
	client *supa.Client
	db     *sql.DB
}

// NewRoomHandler creates a new RoomHandler instance
func NewRoomHandler(db *sql.DB) *RoomHandler {
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

	handler := &RoomHandler{
		client: client,
		db:     db,
	}

	// Test the connection
	if err := handler.checkSupabaseConnection(); err != nil {
		log.Printf("Warning: Supabase connection check failed: %v", err)
	}

	return handler
}

// checkSupabaseConnection tests the Supabase connection
func (h *RoomHandler) checkSupabaseConnection() error {
	// Try a simple query to test the connection
	result, _, err := h.client.From("rooms").
		Select("count", "*", false).
		Execute()

	if err != nil {
		return fmt.Errorf("failed to connect to Supabase: %v", err)
	}

	log.Printf("Supabase connection test result: %v", result)
	return nil
}

func (h *RoomHandler) GetAvailableRooms(c *gin.Context) {
	log.Printf("GetAvailableRooms called with token: %v", c.GetHeader("Authorization") != "")

	// Get query parameters
	date := c.Query("date")
	if date == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Date parameter is required"})
		return
	}

	// Get time parameters
	startTime := c.Query("start_time")
	endTime := c.Query("end_time")

	// Default time range if not provided
	if startTime == "" {
		startTime = "00:00"
	}
	if endTime == "" {
		endTime = "23:59"
	}

	// Capacity filter
	minCapacity := 0
	var err error
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

	// First, get all rooms
	roomsQuery := h.client.From("rooms").Select("*", "", false)

	// Add filters only if needed
	if minCapacity > 0 {
		roomsQuery = roomsQuery.Filter("capacity", "gte", fmt.Sprint(minCapacity))
	}

	if roomType != "" && roomType != "all" {
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process rooms data"})
		return
	}

	startDateTime := fmt.Sprintf("%sT%s:00Z", date, startTime)
	endDateTime := fmt.Sprintf("%sT%s:00Z", date, endTime)

	log.Printf("Checking availability for time range: %s to %s", startDateTime, endDateTime)

	// Get all events for this day that might overlap with our request
	eventsQuery := h.client.From("events").
		Select("*", "", false).
		Filter("status", "eq", "upcoming")

	// This is the key improvement - properly get events that overlap with our time slot
	dateOnly := strings.Split(date, "T")[0]
	dayStart := fmt.Sprintf("%sT00:00:00Z", dateOnly)
	dayEnd := fmt.Sprintf("%sT23:59:59Z", dateOnly)

	// Get all events for this day first
	eventsQuery = eventsQuery.Filter("event_date", "gte", dayStart)
	eventsQuery = eventsQuery.Filter("event_date", "lt", dayEnd)

	eventsResult, eventCount, err := eventsQuery.Execute()
	if err != nil {
		log.Printf("Error fetching events: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch events"})
		return
	}

	log.Printf("Found %d events for day %s", eventCount, dateOnly)

	var events []models.Event
	if err := json.Unmarshal(eventsResult, &events); err != nil {
		log.Printf("Error unmarshaling events: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process events data"})
		return
	}

	// Parse requested times once
	requestedStartTime, _ := time.Parse(time.RFC3339, startDateTime)
	requestedEndTime, _ := time.Parse(time.RFC3339, endDateTime)

	// Create a map of booked rooms based on time overlap
	bookedRooms := make(map[string]bool)

	for _, event := range events {
		eventTime := event.EventDate
		eventEndTime := event.EventEnd

		// Use simple, reliable overlap check
		hasOverlap := eventTime.Before(requestedEndTime) && eventEndTime.After(requestedStartTime)

		if hasOverlap {
			bookedRooms[event.Venue] = true
			log.Printf("Room %s is booked: Event %s (%v to %v) overlaps with requested time (%v to %v)",
				event.Venue,
				event.Title,
				eventTime.Format("15:04"),
				eventEndTime.Format("15:04"),
				requestedStartTime.Format("15:04"),
				requestedEndTime.Format("15:04"))
		} else {
			log.Printf("Room %s event %s (%v to %v) does NOT overlap with requested time (%v to %v)",
				event.Venue,
				event.Title,
				eventTime.Format("15:04"),
				eventEndTime.Format("15:04"),
				requestedStartTime.Format("15:04"),
				requestedEndTime.Format("15:04"))
		}
	}

	// Filter only available rooms
	var availableRooms []models.Room
	for _, room := range rooms {
		if !bookedRooms[room.Name] {
			availableRooms = append(availableRooms, room)
		} else {
			log.Printf("Filtering out booked room: %s", room.Name)
		}
	}

	log.Printf("Found %d available rooms out of %d total rooms", len(availableRooms), len(rooms))
	c.JSON(http.StatusOK, availableRooms)
}

// GetRooms returns all rooms without availability information
func (h *RoomHandler) GetRooms(c *gin.Context) {
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
