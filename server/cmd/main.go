package main

import (
	"database/sql"
	"lifelong-eee-project/handlers"
	"lifelong-eee-project/middleware"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"

	"log"
	"os"
)

func init() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}
}

func main() {

	requiredEnvVars := []string{
		"SUPABASE_URL",
		"SUPABASE_SERVICE_ROLE_KEY",
		"DATABASE_URL",
	}

	for _, env := range requiredEnvVars {
		if os.Getenv(env) == "" {
			log.Fatalf("Required environment variable %s is not set", env)
		}
	}

	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	router := gin.Default()

	// Add logging
	router.Use(gin.Logger())

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Authorization, Content-Type")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Custom logging middleware
	router.Use(func(c *gin.Context) {
		log.Printf("Request: %s %s", c.Request.Method, c.Request.URL.Path)
		log.Printf("Auth header present: %v", c.GetHeader("Authorization") != "")

		c.Next()

		log.Printf("Response status: %d", c.Writer.Status())
	})

	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}

	defer db.Close()

	eventHandler := handlers.NewEventHandler(db)
	auth := middleware.AuthMiddleware(db)

	// Update past events middleware
	router.Use(func(c *gin.Context) {
		eventHandler.UpdatePastEvents()
		c.Next()
	})

	// Public routes
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Protected routes
	protected := router.Group("/api")
	protected.Use(auth)
	{
		// Events routes
		protected.GET("/events", eventHandler.GetEvents)

		// User routes
		protected.GET("/users/role", func(c *gin.Context) {
			userRole := c.GetString("userRole")
			if userRole == "" {
				c.JSON(400, gin.H{"error": "No role found"})
				return
			}
			log.Printf("Returning role: %s", userRole)
			c.JSON(200, gin.H{"role": userRole})
		})

		// Event routes for all authenticated users
		protected.POST("/events/:id/register", eventHandler.RegisterForEvent)
		protected.GET("/events/registered/:userId", eventHandler.GetRegisteredEvents)

		// Student leader routes
		studentLeader := protected.Group("/")
		studentLeader.Use(middleware.RequireRole("student_leader"))
		{
			studentLeader.POST("/events", eventHandler.CreateEvent)
			studentLeader.PUT("/events/:id/cancel", eventHandler.CancelEvent)
			router.GET("/api/rooms/availability", middleware.AuthMiddleware(db), eventHandler.GetRoomAvailability)
		}
	}

	log.Printf("Server starting on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
