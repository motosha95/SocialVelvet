# Socializing Backend API

Backend API server for the Socializing mobile app, built with Node.js, Express, TypeScript, and PostgreSQL.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Zod

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (running locally or remote)
- Git

## Setup Instructions

### 1. Clone and Install

```bash
# Create new directory for backend
mkdir socializing-backend
cd socializing-backend

# Copy all files from backend/ directory to here
# Or initialize git and copy files

# Install dependencies
npm install
```

### 2. Database Setup

1. Create a PostgreSQL database:
```bash
# Using psql
createdb socializing

# Or using SQL
psql -U postgres
CREATE DATABASE socializing;
```

2. Update `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Edit `.env` and set your database URL:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/socializing?schema=public"
JWT_SECRET="your-random-secret-key-here"
PORT=3001
FRONTEND_URL="http://localhost:8081"
```

3. Generate Prisma client and run migrations:
```bash
npm run db:generate
npm run db:push
```

### 3. Start Development Server

```bash
npm run dev
```

Server will run on `http://localhost:3001`

### 4. Optional: Open Prisma Studio

```bash
npm run db:studio
```

Opens a GUI to view/edit database data at `http://localhost:5555`

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Events

- `GET /events` - List all events
- `GET /events/:id` - Get event by ID
- `POST /events` - Create event (requires auth)
- `POST /events/:id/join` - Join event (requires auth)
- `POST /events/:id/leave` - Leave event (requires auth)
- `GET /events/:id/attendees` - Get event attendees

### Health Check

- `GET /health` - Server health check

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment (development/production) | No |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: http://localhost:8081) |

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── db/
│   │   └── client.ts          # Prisma client
│   ├── middleware/
│   │   ├── auth.ts            # Authentication middleware
│   │   └── errorHandler.ts    # Error handling
│   ├── routes/
│   │   ├── auth.ts            # Auth routes
│   │   └── events.ts          # Event routes
│   ├── services/
│   │   └── events.ts          # Event business logic
│   ├── types/
│   │   └── index.ts           # TypeScript types (matching frontend)
│   ├── utils/
│   │   ├── jwt.ts             # JWT utilities
│   │   └── password.ts        # Password hashing
│   └── index.ts               # Express app entry point
├── .env.example               # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Database Schema

- **User**: id, email, name, password (hashed), timestamps
- **Event**: id, title, description, location, date, imageUrl, maxAttendees, organizerId, timestamps
- **EventAttendee**: id, userId, eventId, joinedAt

## Development

```bash
# Run in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type check
npm run typecheck

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database (dev)
npm run db:migrate     # Create migration (prod)
npm run db:studio      # Open Prisma Studio
```

## Connecting Frontend

Update your frontend API calls to point to the backend:

1. Create an API client in your frontend (e.g., `src/api/client.ts`)
2. Set base URL to `http://localhost:3001` (or your backend URL)
3. Add JWT token to Authorization header: `Bearer <token>`
4. Update API calls in `src/api/authApi.ts` and `src/api/eventsApi.ts`

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET` (random string)
3. Use production PostgreSQL database
4. Update `FRONTEND_URL` to your frontend domain
5. Build: `npm run build`
6. Start: `npm start`
7. Consider using PM2 or similar process manager

## Notes

- All dates are stored as UTC in database, returned as ISO 8601 strings
- Passwords are hashed using bcrypt (10 rounds)
- JWT tokens expire in 7 days
- CORS is enabled for frontend URL only
- Error responses follow consistent format: `{ error: { message, statusCode } }`
