# EEE Lifelong Learning Platform

A comprehensive platform for managing events, registrations, and user profiles for lifelong learning initiatives.

## Project Overview

This platform provides a complete solution for event management with different user roles (admin, leader, regular users), event registration, and room management capabilities.

## Technology Stack

### Frontend

- React.js
- Tailwind CSS
- Vite

### Backend

- Golang
- SQL Database

## Directory Structure

```
Directory structure:
└── cyprus09-eee-lifelong-master/
    ├── readme.md
    ├── Dockerfile
    ├── .dockerignore
    ├── client/
    │   ├── README.md
    │   ├── components.json
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── postcss.config.js
    │   ├── tailwind.config.js
    │   ├── tsconfig.app.json
    │   ├── tsconfig.json
    │   ├── vercel.json
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   ├── src/
    │   │   ├── App.css
    │   │   ├── App.jsx
    │   │   ├── custom.d.ts
    │   │   ├── index.css
    │   │   ├── main.jsx
    │   │   ├── assets/
    │   │   │   ├── carousel/
    │   │   │   └── event_types/
    │   │   ├── components/
    │   │   │   ├── ProtectedRoute.jsx
    │   │   │   ├── common/
    │   │   │   │   ├── CancelDialog.jsx
    │   │   │   │   ├── CarouselSlides.jsx
    │   │   │   │   ├── EmailPreferences.jsx
    │   │   │   │   ├── ErrorBoundary.jsx
    │   │   │   │   ├── EventDialog.jsx
    │   │   │   │   ├── ExportAttendeesDialog.jsx
    │   │   │   │   ├── ExportEventsDialog.jsx
    │   │   │   │   ├── Footer.jsx
    │   │   │   │   ├── Navbar.jsx
    │   │   │   │   └── RegisterDialog.jsx
    │   │   │   ├── leader/
    │   │   │   │   ├── AddEventForm.jsx
    │   │   │   │   └── EditEventForm.jsx
    │   │   │   └── ui/
    │   │   ├── contexts/
    │   │   │   └── AuthContext.jsx
    │   │   ├── hooks/
    │   │   │   └── use-toast.tsx
    │   │   ├── lib/
    │   │   │   ├── supabaseClient.jsx
    │   │   │   └── utils.ts
    │   │   └── pages/
    │   │       ├── admin/
    │   │       │   ├── AdminDashboard.jsx
    │   │       │   ├── RoomManagementDashboard.jsx
    │   │       │   └── UserManagementDashboard.jsx
    │   │       ├── common/
    │   │       │   ├── HomePage.jsx
    │   │       │   ├── LoginPage.jsx
    │   │       │   ├── NotFoundPage.jsx
    │   │       │   ├── ProfilePage.jsx
    │   │       │   └── RegisterPage.jsx
    │   │       ├── leader/
    │   │       │   ├── AddEventFormDeprecated.jsx
    │   │       │   ├── DashboardOverview.jsx
    │   │       │   ├── EventAnalytics.jsx
    │   │       │   ├── EventManagement.jsx
    │   │       │   ├── RoomCalendarView.jsx
    │   │       │   ├── RoomManagementDialog.jsx
    │   │       │   └── StudentLeaderDashboard.jsx
    │   │       └── student/
    │   │           └── EventsPage.jsx
    │   ├── supabase/
    │   │   ├── config.toml
    │   │   ├── .gitignore
    │   │   └── functions/
    │   │       └── send-event-notifications/
    │   │           └── index.ts
    │   └── .vscode/
    │       └── extensions.json
    ├── db/
    │   ├── email-notifs.sql
    │   ├── main.sql
    │   └── sample_events.sql
    ├── server/
    │   ├── go.mod
    │   ├── go.sum
    │   ├── api/
    │   │   └── routes/
    │   │       ├── auth.go
    │   │       └── event.go
    │   ├── cmd/
    │   │   └── main.go
    │   ├── db/
    │   │   └── db.go
    │   ├── handlers/
    │   │   ├── auth.go
    │   │   ├── event.go
    │   │   ├── leader_dashboard.go
    │   │   ├── profile_dashboard.go
    │   │   ├── room_dashboard.go
    │   │   ├── rooms.go
    │   │   └── student_leader.go
    │   ├── middleware/
    │   │   └── auth.go
    │   └── models/
    │       ├── auth.go
    │       ├── event.go
    │       ├── profiles.go
    │       └── rooms.go
    └── sitemaps/
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- Go (v1.18+)
- PostgreSQL
- Supabase account

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgres://username@localhost:5432/database_name
```

### Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

```bash
# Navigate to server directory
cd server

# Install Go dependencies
go mod download

# Run the server
go run cmd/main.go
```

### Database Setup

```bash
# Import the main database schema
mysql -u username -p database_name < db/main.sql

# Import sample events data (optional)
mysql -u username -p database_name < db/sample_events.sql
```

## Features

### User Authentication

- Registration and login
- Protected routes
- Role-based access control (Admin, Student Leader, User)

### Event Management

- Browse available events
- Register for events
- Create and manage events (Admin/Student Leader)
- Cancel registrations

### Room Management

- Room booking and availability
- Room capacity tracking
- Room analytics (Admin)

### Admin Dashboard

- User management
- Event oversight
- Room management

## API Endpoints

### Public Endpoints

- `GET /` - API Status check
- `GET /health` - API Health check

### Authentication

- JWT Authentication is implemented via supabase middleware

### Common Endpoints (All Authenticated Users)

- `GET /api/events` - List all events
- `GET /api/users/role` - Get current user's role
- `POST /api/events/:id/register` - Register for an event
- `GET /api/events/registered/:userId` - Get user's registered events
- `GET /api/rooms/availability` - Check room availability

### User Profile Management

- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id/notifications` - Update notification preferences

### Student Leader Endpoints

- `POST /api/events` - Create a new event
- `PUT /api/events/:id` - Update event details
- `PUT /api/events/:id/cancel` - Cancel an event

### Shared Endpoints (Admin and Student Leaders)

- `GET /api/events/:id/attendees` - Get event attendees
- `GET /api/events/stats` - Get event statistics
- `GET /api/rooms` - List all rooms
- `GET /api/rooms/available` - Get available rooms

### Admin Endpoints

- `POST /api/admin/rooms` - Create a new room
- `GET /api/admin/rooms/:id` - Get room details
- `PUT /api/admin/rooms/:id` - Update room details
- `DELETE /api/admin/rooms/:id` - Delete a room
- `GET /api/admin/rooms/analytics` - Get room usage analytics
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user details
- `PUT /api/admin/users/:id/disable` - Disable a user account

## Development

### Frontend Component Structure

- `common/` - Shared components (Navbar, Footer, etc.)
- `ui/` - Shadcn UI components
- `pages/` - Main page components
- `contexts/` - React context providers
- `hooks/` - Custom React hooks

### Backend Structure

- `api/` - API route definitions
- `handlers/` - Request handlers
- `middleware/` - Custom middleware
- `models/` - Data models
- `db/` - Database connection and queries

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Shadcn UI](https://ui.shadcn.com/) - UI component library
- [Go](https://golang.org/) - Backend language
- [React](https://reactjs.org/) - Frontend framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Supabase](https://supabase.io/) - Backend-as-a-Service
- [Gin](https://gin-gonic.com/) - Go web framework
