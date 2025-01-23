package cmd

import (
	"database/sql"
	"log"
	"os"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"lifelong-eee-project/server/handlers"
	"lifelong-eee-project/server/middleware"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatal(err)
	}

	defer db.Close()

	router := gin.Default()
	eventHandler := handlers.NewEventHandler(db)
	auth := middleware.AuthMiddleware(db)

	// Middleware to update past events
	router.Use(func(c *gin.Context) {
		handlers.UpdatePastEvents(db)
		c.Next()
	})

	// Public routes
	router.GET("/events", eventHandler.GetEvents)

	// Protected routes
	protected := router.Group("/")
	protected.Use(auth)
	{
		// Student leader routes
		studentLeader := protected.Group("/")
		studentLeader.Use(middleware.RequireRole("student_leader"))
		{
			studentLeader.POST("/events", eventHandler.CreateEvent)
		}

	// Routes for authenticated users
	protected.POST("/events/:id/register", eventHandler.RegisterForEvent)
	protected.GET("/events/registered/:userId", eventHandler.GetRegisteredEvents)

	router.Run(":8080")
}
}