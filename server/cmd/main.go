package main

import (
	"database/sql"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"lifelong-eee-project/server/handlers"
	"lifelong-eee-project/server/middleware"
	"log"
	"os"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
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
	router.GET("/api/events", eventHandler.GetEvents)

	// Protected routes
	protected := router.Group("/api")
	protected.Use(auth)
	{
		// User routes
		protected.GET("/users/role", func(c *gin.Context) {
			c.JSON(200, gin.H{"role": c.GetString("userRole")})
		})

		// Event routes for all authenticated users
		protected.POST("/events/:id/register", eventHandler.RegisterForEvent)
		protected.GET("/events/registered/:userId", eventHandler.GetRegisteredEvents)

		// Student leader routes
		studentLeader := protected.Group("/")
		studentLeader.Use(middleware.RequireRole("student_leader"))
		{
			studentLeader.POST("/events", eventHandler.CreateEvent)
		}
	}

	router.Run(":8080")
}
