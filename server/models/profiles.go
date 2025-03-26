package models

import (
	"encoding/json"
	"time"
)

// User profile structure matching the profiles table
type Profile struct {
	ID                      string          `json:"id"`
	Role                    string          `json:"role"`
	UpdatedAt               time.Time       `json:"updated_at"`
	Username                string          `json:"username"`
	BatchYear               *int            `json:"batch_year"`
	NotificationPreferences json.RawMessage `json:"notification_preferences"`
	Email                   string          `json:"email,omitempty"`
}

// Notification preferences structure
type NotificationPreferences struct {
	EventsEnabled  bool     `json:"events_enabled"`
	EventTypes     []string `json:"event_types"`
	EmailFrequency string   `json:"email_frequency"`
}
