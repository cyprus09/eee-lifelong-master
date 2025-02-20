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
