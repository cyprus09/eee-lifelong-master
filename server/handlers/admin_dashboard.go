package handlers

import (
	"encoding/json"
	"lifelong-eee-project/models"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CreateRoom creates a new room
func (h *EventHandler) CreateRoom(c *gin.Context) {
	log.Printf("CreateRoom called with token: %v", c.GetHeader("Authorization") != "")

	// Parse request body
	var room models.Room
	if err := c.ShouldBindJSON(&room); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Validate required fields
	if room.Name == "" || room.RoomType == "" || room.Building == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name, room type, and building are required"})
		return
	}

	// Generate an ID and set timestamps
	room.ID = uuid.New().String()
	now := time.Now()
	room.CreatedAt = now
	room.UpdatedAt = now

	// Insert into database
	roomJSON, err := json.Marshal(room)
	if err != nil {
		log.Printf("Error marshaling room: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process room data"})
		return
	}

	result, _, err := h.client.From("rooms").Insert(roomJSON, false, "", "", "").Execute()
	if err != nil {
		log.Printf("Error creating room: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create room"})
		return
	}

	// Parse the response
	var createdRoom models.Room
	if err := json.Unmarshal(result, &createdRoom); err != nil {
		log.Printf("Error unmarshaling created room: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process room data"})
		return
	}

	log.Printf("Room created successfully: %s", room.ID)
	c.JSON(http.StatusCreated, createdRoom)
}

// UpdateRoom updates an existing room
func (h *EventHandler) UpdateRoom(c *gin.Context) {
	log.Printf("UpdateRoom called with token: %v", c.GetHeader("Authorization") != "")

	// Get room ID from URL parameter
	roomID := c.Param("id")
	if roomID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room ID is required"})
		return
	}

	// Parse request body
	var roomUpdate models.Room
	if err := c.ShouldBindJSON(&roomUpdate); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Check if room exists
	roomResult, count, err := h.client.From("rooms").
		Select("*", "", false).
		Filter("id", "eq", roomID).
		Execute()

	if err != nil {
		log.Printf("Error checking if room exists: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check if room exists"})
		return
	}

	if count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	// Parse the existing room
	var existingRooms []models.Room
	if err := json.Unmarshal(roomResult, &existingRooms); err != nil {
		log.Printf("Error unmarshaling existing room: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process room data"})
		return
	}

	if len(existingRooms) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	existingRoom := existingRooms[0]

	// Update fields while preserving ID and creation time
	roomUpdate.ID = existingRoom.ID
	roomUpdate.CreatedAt = existingRoom.CreatedAt
	roomUpdate.UpdatedAt = time.Now()

	// Validate required fields
	if roomUpdate.Name == "" || roomUpdate.RoomType == "" || roomUpdate.Building == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name, room type, and building are required"})
		return
	}

	// Update in database
	roomJSON, err := json.Marshal(roomUpdate)
	if err != nil {
		log.Printf("Error marshaling room update: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process room data"})
		return
	}

	_, _, err = h.client.From("rooms").
		Update(string(roomJSON), "", "").
		Eq("id", roomID).
		Execute()

	if err != nil {
		log.Printf("Error updating room: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update room"})
		return
	}

	log.Printf("Room updated successfully: %s", roomID)
	c.JSON(http.StatusOK, roomUpdate)
}

// DeleteRoom deletes a room
func (h *EventHandler) DeleteRoom(c *gin.Context) {
	log.Printf("DeleteRoom called with token: %v", c.GetHeader("Authorization") != "")

	// Get room ID from URL parameter
	roomID := c.Param("id")
	if roomID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room ID is required"})
		return
	}

	// Check if there are any upcoming events in this room
	eventsResult, count, err := h.client.From("events").
		Select("*", "", false).
		Filter("venue", "eq", roomID).
		Filter("status", "eq", "upcoming").
		Execute()

	if err != nil {
		log.Printf("Error checking for upcoming events: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check for upcoming events"})
		return
	}

	if count > 0 {
		var events []models.Event
		if err := json.Unmarshal(eventsResult, &events); err == nil && len(events) > 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":  "Cannot delete room with upcoming events",
				"count":  count,
				"events": events,
			})
			return
		}
	}

	// Delete from database
	_, _, err = h.client.From("rooms").
		Delete("", "").
		Eq("id", roomID).
		Execute()

	if err != nil {
		log.Printf("Error deleting room: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete room"})
		return
	}

	log.Printf("Room deleted successfully: %s", roomID)
	c.JSON(http.StatusOK, gin.H{"message": "Room deleted successfully"})
}

// GetRoomById retrieves a specific room by ID
func (h *EventHandler) GetRoomById(c *gin.Context) {
	log.Printf("GetRoomById called with token: %v", c.GetHeader("Authorization") != "")

	// Get room ID from URL parameter
	roomID := c.Param("id")
	if roomID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room ID is required"})
		return
	}

	// Get room from database
	roomResult, count, err := h.client.From("rooms").
		Select("*", "", false).
		Filter("id", "eq", roomID).
		Execute()

	if err != nil {
		log.Printf("Error fetching room: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch room"})
		return
	}

	if count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	// Parse the room
	var rooms []models.Room
	if err := json.Unmarshal(roomResult, &rooms); err != nil {
		log.Printf("Error unmarshaling room: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process room data"})
		return
	}

	if len(rooms) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	log.Printf("Room fetched successfully: %s", roomID)
	c.JSON(http.StatusOK, rooms[0])
}

// GetRoomAnalytics provides analytics data for rooms
func (h *EventHandler) GetRoomAnalytics(c *gin.Context) {
	log.Printf("GetRoomAnalytics called with token: %v", c.GetHeader("Authorization") != "")

	// First, get all rooms
	roomsResult, _, err := h.client.From("rooms").Select("*", "", false).Execute()
	if err != nil {
		log.Printf("Error fetching rooms for analytics: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rooms"})
		return
	}

	var rooms []models.Room
	if err := json.Unmarshal(roomsResult, &rooms); err != nil {
		log.Printf("Error unmarshaling rooms: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process rooms data"})
		return
	}

	// Get all events (including past events for historical data)
	eventsResult, _, err := h.client.From("events").Select("*", "", false).Execute()
	if err != nil {
		log.Printf("Error fetching events for analytics: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch events"})
		return
	}

	var events []models.Event
	if err := json.Unmarshal(eventsResult, &events); err != nil {
		log.Printf("Error unmarshaling events: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process events data"})
		return
	}

	// Calculate room usage statistics
	roomUsage := make(map[string]struct {
		EventCount     int
		AttendeeCount  int
		UtilizationPct float64
	})

	// Count events and attendees by room
	for _, event := range events {
		roomStats := roomUsage[event.Venue]
		roomStats.EventCount++
		roomStats.AttendeeCount += event.CurrentAttendees
		roomUsage[event.Venue] = roomStats
	}

	analytics := make([]models.RoomAnalytics, 0, len(rooms))
	for _, room := range rooms {
		usage, exists := roomUsage[room.Name]
		if !exists {
			// Room has never been used
			analytics = append(analytics, models.RoomAnalytics{
				ID:            room.ID,
				Name:          room.Name,
				RoomType:      room.RoomType,
				Building:      room.Building,
				Floor:         room.Floor,
				Capacity:      room.Capacity,
				EventCount:    0,
				AttendeeCount: 0,
				Utilization:   0,
			})
		} else {
			// Room has been used
			analytics = append(analytics, models.RoomAnalytics{
				ID:            room.ID,
				Name:          room.Name,
				RoomType:      room.RoomType,
				Building:      room.Building,
				Floor:         room.Floor,
				Capacity:      room.Capacity,
				EventCount:    usage.EventCount,
				AttendeeCount: usage.AttendeeCount,
				Utilization:   float64(usage.EventCount) / float64(len(events)) * 100,
			})
		}
	}

	roomTypeMap := make(map[string]*models.RoomTypeAnalytics)
	for _, room := range rooms {
		if _, exists := roomTypeMap[room.RoomType]; !exists {
			roomTypeMap[room.RoomType] = &models.RoomTypeAnalytics{
				Type:  room.RoomType,
				Count: 0,
			}
		}
		roomTypeMap[room.RoomType].Count++
	}

	// Count events by room type
	for _, event := range events {
		// Find the room to get its type
		for _, room := range rooms {
			if room.Name == event.Venue {
				if analytics, exists := roomTypeMap[room.RoomType]; exists {
					analytics.EventCount++
				}
				break
			}
		}
	}

	// Calculate utilization percentage
	roomTypes := make([]models.RoomTypeAnalytics, 0, len(roomTypeMap))
	for _, analytics := range roomTypeMap {
		if analytics.Count > 0 {
			analytics.Utilization = float64(analytics.EventCount) / float64(analytics.Count)
		}
		roomTypes = append(roomTypes, *analytics)
	}

	// Calculate daily usage over time (past 30 days)
	dailyUsage := make([]struct {
		Date      string `json:"date"`
		Events    int    `json:"events"`
		Attendees int    `json:"attendees"`
	}, 30)

	now := time.Now()
	for i := 0; i < 30; i++ {
		date := now.AddDate(0, 0, -i)
		dateStr := date.Format("2006-01-02")

		eventsForDate := 0
		attendeesForDate := 0

		for _, event := range events {
			eventDate := event.EventDate.Format("2006-01-02")
			if eventDate == dateStr {
				eventsForDate++
				attendeesForDate += event.CurrentAttendees
			}
		}

		dailyUsage[i] = struct {
			Date      string `json:"date"`
			Events    int    `json:"events"`
			Attendees int    `json:"attendees"`
		}{
			Date:      dateStr,
			Events:    eventsForDate,
			Attendees: attendeesForDate,
		}
	}

	// Reverse the array to have chronological order
	for i, j := 0, len(dailyUsage)-1; i < j; i, j = i+1, j-1 {
		dailyUsage[i], dailyUsage[j] = dailyUsage[j], dailyUsage[i]
	}

	// Build complete analytics response
	response := gin.H{
		"rooms":       analytics,
		"room_types":  roomTypes,
		"daily_usage": dailyUsage,
	}

	c.JSON(http.StatusOK, response)
}
