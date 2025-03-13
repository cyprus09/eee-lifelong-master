package models

import "time"

type Event struct {
	ID               string    `json:"id"`
	Title            string    `json:"title"`
	Description      string    `json:"description"`
	EventDate        time.Time `json:"event_date"`
	Venue            string    `json:"venue"`
	MaxAttendees     int       `json:"max_attendees"`
	CurrentAttendees int       `json:"current_attendees"`
	EventType        string    `json:"event_type"`
	CreatedBy        string    `json:"created_by"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	Status           string    `json:"status"`
	EventEnd         time.Time `json:"event_end"`
}

type Registration struct {
	ID               string    `json:"id"`
	EventID          string    `json:"event_id" binding:"required"`
	UserID           string    `json:"user_id" binding:"required"`
	RegistrationDate time.Time `json:"registration_date"`
}

type RegisteredEvent struct {
	Event            Event     `json:"event"`
	RegistrationDate time.Time `json:"registration_date"`
}

type AttendeesResponse struct {
	ID               string    `json:"id"`
	Name             string    `json:"name"`
	Email            string    `json:"email"`
	UserID           string    `json:"user_id"`
	RegistrationDate time.Time `json:"registration_date"`
}
