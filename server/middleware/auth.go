package middleware

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type SupabaseUser struct {
	ID           string `json:"id"`
	Email        string `json:"email"`
	UserMetadata struct {
		Username  string `json:"username"`
		BatchYear int    `json:"batch_year"`
	} `json:"user_metadata"`
}

func AuthMiddleware(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		log.Printf("Received request with token: %v", token != "")
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No authorization token provided"})
			c.Abort()
			return
		}

		// Verify token and get user ID
		user, err := verifyToken(token)
		if err != nil {
			log.Printf("Token verification error: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Get user role with retry logic
		var role string
		for attempts := 0; attempts < 3; attempts++ {
			err = db.QueryRow("SELECT role FROM profiles WHERE id = $1", user.ID).Scan(&role)
			if err == nil {
				break
			}

			if err == sql.ErrNoRows {
				// Try to create profile
				_, err = db.Exec(`
                    INSERT INTO profiles (id, role, username, updated_at)
                    VALUES ($1, 'student', $2, NOW())
                    ON CONFLICT (id) DO NOTHING
                `, user.ID, user.Email)
				if err != nil {
					log.Printf("Error creating profile on attempt %d: %v", attempts+1, err)
					continue
				}
				role = "student"
				break
			}

			log.Printf("Attempt %d: Database error fetching role: %v", attempts+1, err)
			time.Sleep(time.Millisecond * 100)
		}

		if role == "" {
			role = "student" // Default fallback
		}

		log.Printf("User %s assigned role: %s", user.ID, role)

		c.Set("userId", user.ID)
		c.Set("userRole", role)
		c.Set("userEmail", user.Email)
		c.Set("userMetaData", user.UserMetadata)
		c.Next()
	}
}

func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := c.GetString("userRole")
		log.Printf("Checking role requirement: user has '%s', required: %v", userRole, roles)

		// Handle case where role is empty
		if userRole == "" {
			c.JSON(http.StatusForbidden, gin.H{"error": "No role assigned"})
			c.Abort()
			return
		}

		for _, role := range roles {
			if userRole == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"error":          "Insufficient permissions",
			"required_roles": roles,
			"current_role":   userRole,
		})
		c.Abort()
	}
}

func verifyToken(token string) (*SupabaseUser, error) {
	token = strings.TrimPrefix(token, "Bearer ")

	supabaseUrl := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_ANON_KEY")

	if supabaseUrl == "" || supabaseKey == "" {
		return nil, fmt.Errorf("missing Supabase configuration")
	}

	req, err := http.NewRequest("GET", supabaseUrl+"/auth/v1/user", nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	req.Header.Set("apikey", supabaseKey)
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("invalid token (status %d)", resp.StatusCode)
	}

	var user SupabaseUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, fmt.Errorf("error decoding response: %v", err)
	}

	if user.ID == "" {
		return nil, fmt.Errorf("invalid user data received")
	}

	return &user, nil
}
