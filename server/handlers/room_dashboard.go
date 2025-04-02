package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"lifelong-eee-project/models"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CreateRoom creates a new room
func (h *RoomHandler) CreateRoom(c *gin.Context) {
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

	// Validate room type
	validRoomTypes := []string{"classroom", "lab", "auditorium", "meeting_room"}
	isValid := false
	for _, rt := range validRoomTypes {
		if room.RoomType == rt {
			isValid = true
			break
		}
	}

	if !isValid {
		log.Printf("Invalid room type: %s", room.RoomType)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room type"})
		return
	}

	// Generate an ID and set timestamps
	room.ID = uuid.New().String()
	now := time.Now()
	room.CreatedAt = now
	room.UpdatedAt = now

	// Log the room creation attempt
	log.Printf("Attempting to create room: %+v", room)

	// Use the same approach as in CreateEvent
	result, count, err := h.client.From("rooms").Insert(&room, false, "*", "", "*").Execute()

	log.Printf("Supabase response: result=%s, count=%d, err=%v", string(result), count, err)

	if err != nil {
		log.Printf("Error creating room: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create room: %v", err)})
		return
	}

	var createdRooms []models.Room
	if err := json.Unmarshal(result, &createdRooms); err != nil {
		log.Printf("Error unmarshaling created room: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process created room"})
		return
	}

	if len(createdRooms) == 0 {
		log.Printf("No room was created")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No room was created"})
		return
	}

	createdRoom := createdRooms[0]
	log.Printf("Room created successfully with ID: %s", createdRoom.ID)
	c.JSON(http.StatusCreated, createdRoom)
}

// UpdateRoom updates an existing room
func (h *RoomHandler) UpdateRoom(c *gin.Context) {
	log.Printf("UpdateRoom called with token: %v", c.GetHeader("Authorization") != "")

	// Get room ID from URL parameter
	roomID := c.Param("id")
	if roomID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room ID is required"})
		return
	}

	log.Printf("Updating room with ID: %s", roomID)

	// Parse request body
	var roomUpdate models.Room
	if err := c.ShouldBindJSON(&roomUpdate); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Validate required fields
	if roomUpdate.Name == "" || roomUpdate.RoomType == "" || roomUpdate.Building == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name, room type, and building are required"})
		return
	}

	// Check if room exists directly with SQL
	var existingRoomID string
	err := h.db.QueryRow("SELECT id FROM rooms WHERE id = $1", roomID).Scan(&existingRoomID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Room not found with ID: %s", roomID)
			c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
			return
		}
		log.Printf("Error checking if room exists: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check if room exists"})
		return
	}

	// Update fields for database
	updateFields := map[string]interface{}{
		"name":       roomUpdate.Name,
		"room_type":  roomUpdate.RoomType,
		"building":   roomUpdate.Building,
		"floor":      roomUpdate.Floor,
		"capacity":   roomUpdate.Capacity,
		"updated_at": time.Now(),
	}

	log.Printf("Updating room with data: %+v", updateFields)

	// Start transaction
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

	// Update in SQL database
	_, err = tx.Exec(`
		UPDATE rooms 
		SET name = $1, 
			room_type = $2, 
			building = $3, 
			floor = $4, 
			capacity = $5, 
			updated_at = $6
		WHERE id = $7`,
		roomUpdate.Name,
		roomUpdate.RoomType,
		roomUpdate.Building,
		roomUpdate.Floor,
		roomUpdate.Capacity,
		time.Now(),
		roomID,
	)

	if err != nil {
		log.Printf("Error updating room in SQL: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update room"})
		return
	}

	if err := tx.Commit(); err != nil {
		log.Printf("Error committing transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit changes"})
		return
	}

	// Also update in Supabase
	supResult, _, err := h.client.From("rooms").
		Update(updateFields, "", "").
		Eq("id", roomID).
		Execute()

	if err != nil {
		log.Printf("Warning: Error updating room in Supabase: %v", err)
		// Don't return error, continue with the response
	} else {
		log.Printf("Successfully updated room in Supabase: %s", string(supResult))
	}

	// Query the updated room for response
	var updatedRoom models.Room
	err = h.db.QueryRow(`
		SELECT id, name, room_type, building, floor, capacity, created_at, updated_at 
		FROM rooms WHERE id = $1`, roomID).Scan(
		&updatedRoom.ID,
		&updatedRoom.Name,
		&updatedRoom.RoomType,
		&updatedRoom.Building,
		&updatedRoom.Floor,
		&updatedRoom.Capacity,
		&updatedRoom.CreatedAt,
		&updatedRoom.UpdatedAt,
	)

	if err != nil {
		log.Printf("Error fetching updated room: %v", err)
		// Still return success but with minimal info
		c.JSON(http.StatusOK, gin.H{"message": "Room updated successfully", "id": roomID})
		return
	}

	log.Printf("Room updated successfully: %+v", updatedRoom)
	c.JSON(http.StatusOK, updatedRoom)
}

// DeleteRoom deletes a room
func (h *RoomHandler) DeleteRoom(c *gin.Context) {
	log.Printf("DeleteRoom called with token: %v", c.GetHeader("Authorization") != "")

	// Get room ID from URL parameter
	roomID := c.Param("id")
	if roomID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room ID is required"})
		return
	}

	log.Printf("Attempting to delete room with ID: %s", roomID)

	// Check if room exists
	var roomExists bool
	err := h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM rooms WHERE id = $1)", roomID).Scan(&roomExists)
	if err != nil {
		log.Printf("Error checking if room exists: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check if room exists"})
		return
	}

	if !roomExists {
		log.Printf("Room not found with ID: %s", roomID)
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	// Check if there are any upcoming events in this room
	var eventCount int
	err = h.db.QueryRow(`
		SELECT COUNT(*) FROM events 
		WHERE venue = (SELECT name FROM rooms WHERE id = $1) 
		AND status = 'upcoming'`, roomID).Scan(&eventCount)

	if err != nil {
		log.Printf("Error checking for upcoming events: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check for upcoming events"})
		return
	}

	if eventCount > 0 {
		log.Printf("Cannot delete room with upcoming events: %d events found", eventCount)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete room with upcoming events", "event_count": eventCount})
		return
	}

	// Start transaction
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

	// Delete from SQL database
	_, err = tx.Exec("DELETE FROM rooms WHERE id = $1", roomID)
	if err != nil {
		log.Printf("Error deleting room from SQL: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete room"})
		return
	}

	if err := tx.Commit(); err != nil {
		log.Printf("Error committing transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit changes"})
		return
	}

	// Also delete from Supabase
	_, _, err = h.client.From("rooms").
		Delete("", "").
		Eq("id", roomID).
		Execute()

	if err != nil {
		log.Printf("Warning: Error deleting room from Supabase: %v", err)
		// Don't return error since SQL delete succeeded
	}

	log.Printf("Room deleted successfully: %s", roomID)
	c.JSON(http.StatusOK, gin.H{"message": "Room deleted successfully", "id": roomID})
}

// GetRoomById retrieves a specific room by ID
func (h *RoomHandler) GetRoomById(c *gin.Context) {
	log.Printf("GetRoomById called with token: %v", c.GetHeader("Authorization") != "")

	// Get room ID from URL parameter
	roomID := c.Param("id")
	if roomID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room ID is required"})
		return
	}

	log.Printf("Fetching room with ID: %s", roomID)

	// Get room from database
	var room models.Room
	err := h.db.QueryRow(`
		SELECT id, name, room_type, building, floor, capacity, created_at, updated_at 
		FROM rooms WHERE id = $1`, roomID).Scan(
		&room.ID,
		&room.Name,
		&room.RoomType,
		&room.Building,
		&room.Floor,
		&room.Capacity,
		&room.CreatedAt,
		&room.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Room not found with ID: %s", roomID)
			c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
			return
		}
		log.Printf("Error fetching room: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch room"})
		return
	}

	log.Printf("Room fetched successfully: %+v", room)
	c.JSON(http.StatusOK, room)
}

// GetRoomAnalytics provides analytics data for rooms
func (h *RoomHandler) GetRoomAnalytics(c *gin.Context) {
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
