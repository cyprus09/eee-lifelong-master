package main

import (
	"database/sql"
	"lifelong-eee-project/handlers"
	"lifelong-eee-project/middleware"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func init() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: Error loading .env file: %v", err)
	}
}

// setupRouter configures and returns the Gin router with all middleware
func setupRouter(eventHandler *handlers.EventHandler) *gin.Engine {
	router := gin.Default()

	// Add standard logging
	router.Use(gin.Logger())

	// CORS middleware
	router.Use(setupCORS())

	// Custom request logging middleware
	router.Use(requestLogger())

	// Update past events middleware
	router.Use(func(c *gin.Context) {
		eventHandler.UpdatePastEvents()
		c.Next()
	})

	return router
}

// setupCORS returns the CORS middleware configuration
func setupCORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Authorization, Content-Type")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// requestLogger returns a custom logging middleware
func requestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Printf("Request: %s %s", c.Request.Method, c.Request.URL.Path)
		log.Printf("Auth header present: %v", c.GetHeader("Authorization") != "")

		c.Next()

		log.Printf("Response status: %d", c.Writer.Status())
	}
}

// setupRoutes configures all the API routes
func setupRoutes(router *gin.Engine, eventHandler *handlers.EventHandler, userHandler *handlers.UserHandler, roomHandler *handlers.RoomHandler, auth gin.HandlerFunc) {

	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "API is running"})
	})

	// Public health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// All protected routes under /api
	protected := router.Group("/api")
	protected.Use(auth)

	// Routes for all authenticated users
	setupCommonRoutes(protected, eventHandler, roomHandler)

	// User management routes
	setupUserRoutes(protected, userHandler)

	// Routes for student leaders
	setupStudentLeaderRoutes(protected, eventHandler)

	// Routes shared between admins and student leaders
	setupSharedRoutes(protected, eventHandler, roomHandler)

	// Admin-only routes
	setupAdminRoutes(protected, eventHandler, userHandler, roomHandler)
}

// setupUserRoutes configures routes for user profile management
func setupUserRoutes(rg *gin.RouterGroup, userHandler *handlers.UserHandler) {
	// Routes for standard users
	rg.GET("/users/:id", userHandler.GetUser)
	rg.PUT("/users/:id/notifications", userHandler.UpdateNotificationPreferences)
}

// setupCommonRoutes configures routes available to all authenticated users
func setupCommonRoutes(rg *gin.RouterGroup, eventHandler *handlers.EventHandler, roomHandler *handlers.RoomHandler) {
	// Events routes
	rg.GET("/events", eventHandler.GetEvents)

	// User routes
	rg.GET("/users/role", func(c *gin.Context) {
		userRole := c.GetString("userRole")
		if userRole == "" {
			c.JSON(400, gin.H{"error": "No role found"})
			return
		}
		log.Printf("Returning role: %s", userRole)
		c.JSON(200, gin.H{"role": userRole})
	})

	// Event registration routes
	rg.POST("/events/:id/register", eventHandler.RegisterForEvent)
	rg.GET("/events/registered/:userId", eventHandler.GetRegisteredEvents)

	// Room availability for all users
	rg.GET("/rooms/availability", roomHandler.GetAvailableRooms)
}

// setupStudentLeaderRoutes configures routes available to student leaders
func setupStudentLeaderRoutes(rg *gin.RouterGroup, eventHandler *handlers.EventHandler) {
	studentLeader := rg.Group("/")
	studentLeader.Use(middleware.RequireRole("student_leader"))

	// Event management endpoints
	studentLeader.POST("/events", eventHandler.CreateEvent)
	studentLeader.PUT("/events/:id", eventHandler.EditEvent)
	studentLeader.PUT("/events/:id/cancel", eventHandler.CancelEvent)
}

// setupSharedRoutes configures routes shared between admins and student leaders
func setupSharedRoutes(rg *gin.RouterGroup, eventHandler *handlers.EventHandler, roomHandler *handlers.RoomHandler) {
	common := rg.Group("/")
	common.Use(middleware.RequireRole("admin", "student_leader"))

	// Shared event management
	common.GET("/events/:id/attendees", eventHandler.GetEventAttendees)
	common.GET("/events/stats", eventHandler.GetEventStats)

	// Room management (read-only)
	common.GET("/rooms", roomHandler.GetRooms)
	common.GET("/rooms/available", roomHandler.GetAvailableRooms)
}

// setupAdminRoutes configures admin-only routes
func setupAdminRoutes(rg *gin.RouterGroup, eventHandler *handlers.EventHandler, userHandler *handlers.UserHandler, roomHandler *handlers.RoomHandler) {
	admin := rg.Group("/admin")
	admin.Use(middleware.RequireRole("admin"))

	// Room CRUD operations
	admin.POST("/rooms", roomHandler.CreateRoom)
	admin.GET("/rooms/:id", roomHandler.GetRoomById)
	admin.PUT("/rooms/:id", roomHandler.UpdateRoom)
	admin.DELETE("/rooms/:id", roomHandler.DeleteRoom)
	admin.GET("/rooms/analytics", roomHandler.GetRoomAnalytics)

	// User management operations
	admin.GET("/users", userHandler.GetUsers)
	admin.PUT("/users/:id", userHandler.UpdateUser)
	admin.PUT("/users/:id/disable", userHandler.DisableUser)
}

func main() {
	// Verify required environment variables
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

	// Connect to the database
	db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}
	defer db.Close()

	// Initialize handlers and middleware
	eventHandler := handlers.NewEventHandler(db)
	userHandler := handlers.NewUserHandler(db)
	roomHandler := handlers.NewRoomHandler(db)
	auth := middleware.AuthMiddleware(db)

	// Setup router with middleware
	router := setupRouter(eventHandler)

	// Setup routes
	setupRoutes(router, eventHandler, userHandler, roomHandler, auth)

	// Start the server
	log.Printf("Server starting on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
