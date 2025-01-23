package middleware

import (
	"database/sql"
	"github.com/gin-gonic/gin"
	"net/http"
)

func AuthMiddleware(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No authorization token provided"})
			c.Abort()
			return
		}

		// Verify token and get user ID
		userID, err := verifyToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Get user role
		var role string
		err = db.QueryRow("SELECT role FROM user_roles WHERE user_id = $1", userID).Scan(&role)
		if err != nil {
			if err == sql.ErrNoRows {
				role = "user" // Default role
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching user role"})
				c.Abort()
				return
			}
		}

		c.Set("userId", userID)
		c.Set("userRole", role)
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
