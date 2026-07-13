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

## Screenshots

| Page | Preview |
|------|---------|
| User Auth | <table><tr><td><img width="400" alt="Screenshot 2026-07-14 at 02 55 47" src="https://github.com/user-attachments/assets/e6fd2d63-71cc-436e-84ce-95b6271a5e06" /></td><td><img width="400" alt="Screenshot 2026-07-14 at 02 56 11" src="https://github.com/user-attachments/assets/55e51c41-7c56-4bac-a7f3-722b65b0b988" /></td></tr></table>|
| Home Page | <img width="500" alt="Screenshot 2026-07-14 at 03 23 53" src="https://github.com/user-attachments/assets/0636722a-6073-42b3-88d7-a577b967e269" /> |
| Profile Page | <img width="500" alt="Screenshot 2026-07-14 at 02 58 07" src="https://github.com/user-attachments/assets/c9cbd8bd-1cf7-4915-80d9-459e2936f45a" /> |
| Events Page (Student Leader Path) | <table><tr><td><img width="400" alt="Screenshot 2026-07-14 at 02 58 51" src="https://github.com/user-attachments/assets/ce4ddbaf-1be1-4364-b342-d0c9690a38f2" /></td><td><img width="400" alt="Screenshot 2026-07-14 at 02 59 06" src="https://github.com/user-attachments/assets/5bb29346-549f-48b7-9352-4c2e099c726c" /></td></tr></table>|
| Admin Dashboard and Analytics (Admin and Student Leader Path) | <table><tr><td><img width="400" alt="Screenshot 2026-07-14 at 03 02 01" src="https://github.com/user-attachments/assets/e8b0e5e5-62da-432c-a7a3-9ce4921141d7" /></td><td><img width="400" height="150" alt="Screenshot 2026-07-14 at 03 07 42" src="https://github.com/user-attachments/assets/d9cbefcd-df34-42c3-bf63-4712f5c46750" /></td></tr></table> |
| Event Management (Student Leader Path) | <table><tr><td><img width="400" alt="Screenshot 2026-07-14 at 03 20 32" src="https://github.com/user-attachments/assets/d0dcbb24-c4d5-46e4-bf55-7f0615dcea12" /></td><td><img width="400" alt="Screenshot 2026-07-14 at 03 25 55" src="https://github.com/user-attachments/assets/61598ec5-aecd-46ec-b4f2-37b33bf4a6b3" /></td></tr><tr><td><img width="400" alt="Screenshot 2026-07-14 at 03 22 22" src="https://github.com/user-attachments/assets/8bbcb824-d0a1-4c70-9fdf-abb13d5f5b5e" /></td><td><img width="300" alt="Screenshot 2026-07-14 at 03 22 33" src="https://github.com/user-attachments/assets/22b60371-9a67-4132-a07c-462dfee90680" /></td></tr></table> |
| User Managment (Admin Path) | <table><tr><td><img width="400" alt="Screenshot 2026-07-14 at 03 14 26" src="https://github.com/user-attachments/assets/4ae38a1b-1def-4964-9cc8-175d963469eb" /></td><td><img width="400" alt="Screenshot 2026-07-14 at 03 14 37" src="https://github.com/user-attachments/assets/8f1f8a63-fee7-4421-a6d7-4c62f4194f80" /></td></tr></table> |
| Room Management (Student Leader) | <table><tr><td><img width="400" alt="Screenshot 2026-07-14 at 03 17 04" src="https://github.com/user-attachments/assets/1cf28823-97fc-443e-bfe5-fe467c44a12c" /></td><td><img width="400" alt="Screenshot 2026-07-14 at 03 18 19" src="https://github.com/user-attachments/assets/6cdf1c62-b3c0-4c24-862c-f534235f3869" /></td></tr><tr><td><img width="400" alt="Screenshot 2026-07-14 at 03 18 49" src="https://github.com/user-attachments/assets/0674cac2-2caa-4e92-ac04-383339039449" /></td><td><img width="400" alt="Screenshot 2026-07-14 at 03 17 43" src="https://github.com/user-attachments/assets/c2b756c9-9722-41a7-9129-e89a3e295755" /></td></tr></table> |
| Room Management (Admin) | <table><tr><td><img width="400" alt="Screenshot 2026-07-14 at 03 12 10" src="https://github.com/user-attachments/assets/75fb1e7e-c8d1-48a3-b79d-7117497629aa" /></td><td><img width="400" alt="Screenshot 2026-07-14 at 03 12 40" src="https://github.com/user-attachments/assets/181a50c3-ec95-4666-b82f-4e9a1d81d082" /></td></tr><tr><td><img width="400" alt="Screenshot 2026-07-14 at 03 12 52" src="https://github.com/user-attachments/assets/3940c056-2091-4b49-9dfd-2f84c9e74efa" /></td><td><img width="400" alt="Screenshot 2026-07-14 at 03 13 00" src="https://github.com/user-attachments/assets/2bd87d81-a4f6-4a3b-ab86-9f8f3d898b6f" /></td></tr><tr><td colspan="2" align="center"><img width="400" alt="Screenshot 2026-07-14 at 03 13 46" src="https://github.com/user-attachments/assets/641a6c6b-de5a-4799-9600-ed0b547965fb" /></td></tr></table> | 

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
    │   │   │   ├── admin/
    │   │   │   │   ├── TopUtilizedRooms.jsx
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
