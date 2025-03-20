package models

import "time"

type Room struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	RoomType  string    `json:"room_type"`
	Building  string    `json:"building"`
	Floor     int       `json:"floor"`
	Capacity  int       `json:"capacity"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type RoomAvailability struct {
	Room      Room    `json:"room"`
	Available bool    `json:"available"`
	Events    []Event `json:"events"`
}

type RoomAnalytics struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	RoomType      string  `json:"room_type"`
	Building      string  `json:"building"`
	Floor         int     `json:"floor"`
	Capacity      int     `json:"capacity"`
	EventCount    int     `json:"event_count"`
	AttendeeCount int     `json:"attendee_count"`
	Utilization   float64 `json:"utilization"`
}

type RoomTypeAnalytics struct {
	Type        string  `json:"type"`
	Count       int     `json:"rooms"`
	EventCount  int     `json:"events"`
	Utilization float64 `json:"utilization"`
}
