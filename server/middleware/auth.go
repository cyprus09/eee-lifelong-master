package middleware

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"os"
	"strings"
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
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Get user role
		var role string
		err = db.QueryRow("SELECT role FROM profiles WHERE id = $1", user.ID).Scan(&role)
		if err != nil {
			log.Printf("Error fetching role: %v", err)
			role = "user"
			// if err == sql.ErrNoRows {
			// 	role = "user" // Default role
			// } else {
			// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching user role"})
			// 	c.Abort()
			// 	return
			// }
		}

		log.Printf("User %s has role: %s", user.ID, role)

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

		for _, role := range roles {
			if userRole == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		c.Abort()
	}
}

func verifyToken(token string) (*SupabaseUser, error) {
	token = strings.TrimPrefix(token, "Bearer ")

	supabaseUrl := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_ANON_KEY")

	req, err := http.NewRequest("GET", supabaseUrl+"/auth/v1/user", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("apikey", supabaseKey)
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("invalid token")
	}

	var user SupabaseUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, err
	}

	return &user, nil
}
