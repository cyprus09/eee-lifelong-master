package models

type SupabaseUser struct {
	ID           string `json:"id"`
	Email        string `json:"email"`
	UserMetadata struct {
		Username  string `json:"username"`
		BatchYear int    `json:"batch_year"`
	} `json:"user_metadata"`
}