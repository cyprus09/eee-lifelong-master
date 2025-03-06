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
└── eee-lifelong-master/
    ├── readme.md
    ├── client/
    │   ├── README.md
    │   ├── components.json
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package.json
    │   ├── postcss.config.js
    │   ├── tailwind.config.js
    │   ├── tsconfig.app.json
    │   ├── tsconfig.json
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
    │   │   │   └── carousel/
    │   │   ├── components/
    │   │   │   ├── ProtectedRoute.jsx
    │   │   │   ├── common/
    │   │   │   │   ├── CancelDialog.jsx
    │   │   │   │   ├── CarouselSlides.jsx
    │   │   │   │   ├── EmailPreferences.jsx
    │   │   │   │   ├── ErrorBoundary.jsx
    │   │   │   │   ├── EventDialog.jsx
    │   │   │   │   ├── ExportDialog.jsx
    │   │   │   │   ├── Footer.jsx
    │   │   │   │   ├── Navbar.jsx
    │   │   │   │   └── RegisterDialog.jsx
    │   │   │   ├── leader/
    │   │   │   │   ├── AddEventForm.jsx
    │   │   │   │   └── EditEventForm.jsx
    │   │   │   └── ui/
    │   │   │       ├── alert-dialog.tsx
    │   │   │       ├── alert.tsx
    │   │   │       ├── avatar.tsx
    │   │   │       ├── badge.tsx
    │   │   │       ├── button.tsx
    │   │   │       ├── calendar.tsx
    │   │   │       ├── card.tsx
    │   │   │       ├── carousel.tsx
    │   │   │       ├── checkbox.tsx
    │   │   │       ├── dialog.tsx
    │   │   │       ├── dropdown-menu.tsx
    │   │   │       ├── input.tsx
    │   │   │       ├── label.tsx
    │   │   │       ├── select.tsx
    │   │   │       ├── separator.tsx
    │   │   │       ├── sonner.tsx
    │   │   │       ├── table.tsx
    │   │   │       ├── tabs.tsx
    │   │   │       ├── textarea.tsx
    │   │   │       ├── toast.tsx
    │   │   │       ├── toaster.tsx
    │   │   │       └── tooltip.tsx
    │   │   ├── contexts/
    │   │   │   └── AuthContext.jsx
    │   │   ├── hooks/
    │   │   │   └── use-toast.tsx
    │   │   ├── lib/
    │   │   │   └── utils.ts
    │   │   └── pages/
    │   │       ├── admin/
    │   │       │   └── AdminDashboard.jsx
    │   │       ├── common/
    │   │       │   ├── HomePage.jsx
    │   │       │   ├── LoginPage.jsx
    │   │       │   ├── NotFoundPage.jsx
    │   │       │   ├── ProfilePage.jsx
    │   │       │   └── RegisterPage.jsx
    │   │       ├── leader/
    │   │       │   ├── RoomManagementDialog.jsx
    │   │       │   └── StudentLeaderDashboard.jsx
    │   │       └── student/
    │   │           └── EventsPage.jsx
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
    │   │   ├── rooms.go
    │   │   └── student_leader.go
    │   ├── middleware/
    │   │   └── auth.go
    │   └── models/
    │       ├── event.go
    │       ├── rooms.go
    │       └── user.go
    └── sitemaps/
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- Go (v1.18+)
- MySQL or PostgreSQL

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
- Role-based access control (Admin, Leader, User)

### Event Management

- Browse available events
- Register for events
- Create and manage events (Admin/Leader)
- Cancel registrations

### Room Management

- Room booking and availability
- Room capacity tracking

### Admin Dashboard

- User management
- Event oversight
- System configuration

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get user profile

### Events

- `GET /api/events` - List all events
- `POST /api/events` - Create a new event (Admin/Leader)
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event (Admin/Leader)
- `DELETE /api/events/:id` - Delete event (Admin/Leader)
- `POST /api/events/:id/register` - Register for an event
- `DELETE /api/events/:id/register` - Cancel registration

### Rooms

- `GET /api/rooms` - List all rooms
- `POST /api/rooms` - Create a new room (Admin)
- `PUT /api/rooms/:id` - Update room details (Admin)
- `DELETE /api/rooms/:id` - Delete a room (Admin)

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
