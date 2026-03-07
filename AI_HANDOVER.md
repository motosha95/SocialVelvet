# AI Handover Document - Socializing App

**Date:** March 7, 2026  
**Branch:** `cursor/ai-handover-file-fb0f`  
**Status:** Active Development

---

## 📋 Project Overview

**Socializing** is a React Native mobile application (Expo) with a Node.js/Express backend for organizing and attending social events. The app includes features for event management, user interactions, gamification, payments, and real-time chat.

### Key Capabilities
- Event creation, discovery, and attendance
- User authentication and profiles
- Payment processing (Stripe, points, cash)
- Gamification system (points, challenges, VIP tiers)
- Real-time chat for event attendees
- Push notifications
- QR code ticket scanning
- Event series and recurring events
- VIP subscription features

---

## 🛠 Tech Stack

### Frontend (React Native / Expo)
- **Framework:** Expo SDK ~54.0.30
- **Language:** TypeScript
- **State Management:** Zustand
- **Navigation:** React Navigation (Stack + Bottom Tabs)
- **UI Libraries:**
  - `@stripe/stripe-react-native` (v0.50.3) - Payment processing
  - `expo-notifications` - Push notifications
  - `expo-location` - Location services
  - `expo-image-picker` - Image selection
  - `expo-camera` - QR code scanning
  - `react-native-qrcode-svg` - QR code generation
- **Storage:** `@react-native-async-storage/async-storage`

### Backend (Node.js / Express)
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma 5.19.0
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod
- **File Upload:** Multer
- **Payment:** Stripe SDK
- **Password Hashing:** bcrypt

---

## 📁 Project Structure

```
/workspace
├── src/                          # Frontend React Native app
│   ├── api/                      # API client and endpoints
│   │   ├── client.ts            # Base API client with auth
│   │   ├── authApi.ts           # Authentication endpoints
│   │   ├── eventsApi.ts         # Event endpoints
│   │   ├── userApi.ts           # User endpoints
│   │   ├── chatApi.ts           # Chat endpoints
│   │   ├── uploadApi.ts         # File upload endpoints
│   │   └── followApi.ts         # Follow/unfollow endpoints
│   ├── features/                # Feature modules
│   │   ├── auth/                # Authentication screens
│   │   ├── events/              # Event screens and components
│   │   ├── chat/                # Chat screens
│   │   ├── profile/             # User profile screens
│   │   ├── challenges/          # Gamification/challenges
│   │   └── bookings/            # User bookings/tickets
│   ├── store/                   # Zustand state stores
│   │   ├── auth/                # Authentication state
│   │   ├── events/              # Events state
│   │   ├── user/                # User state
│   │   └── chat/                # Chat state
│   ├── navigation/              # Navigation configuration
│   ├── components/              # Reusable components
│   ├── services/                # App services (push notifications, storage)
│   ├── theme/                   # Theme configuration
│   └── utils/                   # Utility functions
│
├── backend/                     # Backend API server
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── seed.ts              # Database seeding
│   ├── src/
│   │   ├── routes/              # Express route handlers
│   │   │   ├── auth.ts          # Authentication routes
│   │   │   ├── events.ts        # Event routes
│   │   │   ├── users.ts         # User routes
│   │   │   ├── chat.ts          # Chat routes
│   │   │   └── upload.ts        # File upload routes
│   │   ├── services/            # Business logic
│   │   │   ├── events.ts        # Event service
│   │   │   ├── chat.ts          # Chat service
│   │   │   ├── challenges.ts    # Challenge service
│   │   │   ├── follows.ts       # Follow service
│   │   │   ├── stripeService.ts # Stripe payment service
│   │   │   ├── upload.ts        # File upload service
│   │   │   ├── pushNotifications.ts # Push notification service
│   │   │   └── eventReminders.ts    # Event reminder scheduler
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.ts          # JWT authentication
│   │   │   └── errorHandler.ts  # Error handling
│   │   ├── utils/               # Utility functions
│   │   ├── constants/           # App constants
│   │   ├── types/               # TypeScript types
│   │   └── index.ts             # Express app entry point
│   └── uploads/                 # Uploaded files directory
│
└── Documentation files:
    ├── CONNECT_FRONTEND_BACKEND.md
    ├── STRIPE_SETUP.md
    ├── NOTIFICATIONS_SETUP.md
    ├── GOOGLE_PLACES_SETUP.md
    ├── backend/README.md
    ├── backend/PAYMENT_IMPLEMENTATION.md
    └── backend/BACKEND_CHANGES_SUMMARY.md
```

---

## 🗄 Database Schema (Prisma)

### Core Models

**User**
- Authentication: email, password (hashed)
- Profile: name, avatarUrl, bio
- Gamification: points, vipTier (null | 'vip' | 'vip_plus')
- Relations: organizedEvents, eventAttendees, tickets, followers/following, messages

**Event**
- Basic: title, description, location, date, imageUrl
- Capacity: maxAttendees
- Pricing: isPaid, price, pricingTiers (JSON), currency (default: AED)
- Features: isTicketed, topics (array, max 3), seriesId, seriesInterval, seriesIndex
- VIP: listFrom (early access date), vipOnly, isCuratedPick
- Status: isCancelled

**EventAttendee**
- Payment: paymentMethod, pointsUsed, cashPrice, creditCardPrice
- Admission: admittedAt (when ticket scanned)

**Ticket**
- Unique ticketNumber
- Scanning: scannedAt, scannedBy (user ID who scanned)

**Challenge & UserChallenge**
- Gamification system for earning points
- Types: ATTEND_EVENTS, etc.
- Progress tracking per user

**Conversation & Message**
- Event-based or direct chat
- Real-time messaging support

**PushToken**
- Expo push tokens per user/device

**Follow**
- User following system

**EventCoHost**
- Co-hosting permissions for events

**EventReminderSent**
- Tracks sent reminders (1h, 24h before event)

---

## ✨ Implemented Features

### ✅ Authentication
- User registration with email/password
- Login with JWT tokens
- Token storage in AsyncStorage
- Protected routes with authentication middleware
- Password hashing with bcrypt

### ✅ Events
- **Create Events:**
  - Title, description, location (Google Places integration)
  - Date/time selection
  - Image upload
  - Pricing (free or paid, with optional pricing tiers)
  - Topics selection (up to 3)
  - Max attendees limit
  - Series support (recurring events)
  - VIP settings (early access, VIP-only)
- **Event Discovery:**
  - List all events
  - Filter by topics
  - VIP early access
  - Event details view
- **Event Attendance:**
  - Join/leave events
  - Ticket generation (QR codes)
  - QR code scanning for admission
  - Payment processing (points, cash, credit card)
- **Event Management:**
  - Copy events
  - Cancel events
  - Co-host support

### ✅ Payments
- **Payment Methods:**
  - Points (full or partial)
  - Cash (12.5% markup)
  - Credit card via Stripe
- **Stripe Integration:**
  - Payment Intent creation
  - Payment Sheet UI
  - Payment verification
- **Points System:**
  - Earn points by attending events (ticket scanned)
  - Use points for paid events
  - Points refund on event leave
  - Points celebration UI

### ✅ Gamification
- Points system
- Challenges/Quests
- VIP tiers (VIP, VIP Plus)
- VIP benefits:
  - Double points
  - Early access to events
  - VIP-only events
  - Curated picks

### ✅ Chat
- Event-based conversations
- Real-time messaging
- Message history
- Participant management

### ✅ User Features
- User profiles
- Follow/unfollow system
- Avatar upload
- Bio editing
- My bookings section

### ✅ Notifications
- Push notification setup (Expo)
- Event reminders (1h, 24h before)
- Push token registration
- Notification service backend

### ✅ QR Codes
- Ticket QR code generation
- QR code scanning for admission
- Ticket validation

### ✅ Location Services
- Google Places API integration
- Location autocomplete
- Current location detection
- Manual location entry fallback

### ✅ File Upload
- Image upload for events and avatars
- Multer backend handling
- File serving endpoint

---

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ (local or remote)
- Expo CLI (for mobile development)
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Database setup:**
   - Create PostgreSQL database:
     ```bash
     createdb socializing
     # or via psql: CREATE DATABASE socializing;
     ```
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Update `.env` with your database URL:
     ```env
     DATABASE_URL="postgresql://username:password@localhost:5432/socializing?schema=public"
     JWT_SECRET="your-random-secret-key-here"
     PORT=3001
     FRONTEND_URL="http://localhost:8081"
     STRIPE_SECRET_KEY="sk_test_..." # Optional, for card payments
     ```

4. **Initialize database:**
   ```bash
   npm run db:generate
   npm run db:push
   # Optional: npm run db:seed
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:3001`

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables:**
   Create `.env` in project root:
   ```env
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." # Optional, for card payments
   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY="..." # Optional, for location autocomplete
   EXPO_PUBLIC_PROJECT_ID="..." # For push notifications
   ```

3. **Start Expo:**
   ```bash
   npm start
   ```

4. **Run on device/emulator:**
   - Scan QR code with Expo Go (development)
   - Or: `npm run android` / `npm run ios` (development build)

### API Configuration

The frontend API client is configured in `src/api/client.ts`. Default base URL is `http://localhost:3001`.

**For physical devices:**
- Use your computer's IP address instead of `localhost`
- Update `API_BASE_URL` in `src/api/client.ts`

**For Android emulator:**
- Use `http://10.0.2.2:3001`

---

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Events
- `GET /events` - List all events (with filters)
- `GET /events/:id` - Get event by ID
- `POST /events` - Create event (auth required)
- `POST /events/:id/join` - Join event (auth required)
  - Body: `{ paymentMethod?, pointsAmount? }`
- `POST /events/:id/leave` - Leave event (auth required)
- `GET /events/:id/attendees` - Get event attendees
- `POST /events/:id/create-payment-intent` - Create Stripe payment intent
- `POST /events/:id/copy` - Copy event (auth required)
- `POST /events/:id/cancel` - Cancel event (auth required)

### Users
- `GET /users/me` - Get current user (auth required)
- `PATCH /users/me` - Update user profile (auth required)
- `POST /users/me/push-token` - Register push token (auth required)
- `GET /users/:id` - Get user by ID
- `POST /users/:id/follow` - Follow user (auth required)
- `DELETE /users/:id/follow` - Unfollow user (auth required)

### Chat
- `GET /chat/conversations` - List conversations (auth required)
- `GET /chat/conversations/:id/messages` - Get messages (auth required)
- `POST /chat/conversations/:id/messages` - Send message (auth required)

### Upload
- `POST /upload` - Upload image (auth required, multipart/form-data)

### Challenges
- `GET /challenges` - List challenges
- `GET /challenges/:id/progress` - Get user progress (auth required)

---

## 🎯 Current State

### Working Features
✅ User authentication (register/login)  
✅ Event creation and management  
✅ Event discovery and filtering  
✅ Join/leave events  
✅ Payment processing (points, cash, Stripe)  
✅ QR code tickets and scanning  
✅ Points system and gamification  
✅ VIP features  
✅ Chat functionality  
✅ Push notification setup  
✅ User profiles and following  
✅ Image uploads  
✅ Event series  
✅ Event reminders (scheduled)  
✅ Google Places location integration  

### Recent Changes (Git History)
- Stripe payment integration
- Event reminder notifications
- Notification service
- VIP subscription features
- Event copy and cancel
- Points system and celebration UI
- QR code scanning
- Ticketed events
- Event series feature
- Location improvements

---

## ⚠️ Known Issues & TODOs

### Potential Issues
1. **Stripe Payment:**
   - Requires development build (not Expo Go)
   - Kotlin 2.x setup needed for Android
   - See `STRIPE_SETUP.md` for troubleshooting

2. **Push Notifications:**
   - iOS requires development build with proper entitlements
   - Expo project ID needed for production

3. **Database Migrations:**
   - Ensure all migrations are applied: `npm run db:push` or `npm run db:migrate`

4. **CORS:**
   - Currently allows all origins in development
   - Should be restricted in production

### Future Enhancements
- [ ] Payment refunds for cancelled events
- [ ] Payment history/transaction records
- [ ] Admin dashboard for payment tracking
- [ ] Enhanced notification types (new follower, quest completed)
- [ ] Event search functionality
- [ ] Event recommendations
- [ ] Social sharing improvements
- [ ] Analytics integration
- [ ] Production deployment setup
- [ ] Testing suite

---

## 📚 Documentation Files

- `CONNECT_FRONTEND_BACKEND.md` - Connection guide and troubleshooting
- `STRIPE_SETUP.md` - Stripe payment setup and Android build issues
- `NOTIFICATIONS_SETUP.md` - Push notification implementation guide
- `GOOGLE_PLACES_SETUP.md` - Google Places API setup
- `backend/README.md` - Backend setup and API documentation
- `backend/PAYMENT_IMPLEMENTATION.md` - Payment feature details
- `backend/BACKEND_CHANGES_SUMMARY.md` - Payment changes summary
- `backend/DATABASE_SETUP.md` - Database setup instructions
- `backend/TESTING.md` - Testing guidelines

---

## 🚀 Development Workflow

### Running the Project

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm start
```

### Database Operations
```bash
cd backend
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes (dev)
npm run db:migrate     # Create migration (prod)
npm run db:studio      # Open Prisma Studio GUI
npm run db:seed        # Seed database
```

### Type Checking
```bash
# Frontend
npm run typecheck

# Backend
cd backend && npm run typecheck
```

---

## 🔐 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
PORT=3001
FRONTEND_URL="http://localhost:8081"
STRIPE_SECRET_KEY="sk_test_..." # Optional
NODE_ENV="development"
```

### Frontend (.env)
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." # Optional
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY="..." # Optional
EXPO_PUBLIC_PROJECT_ID="..." # For push notifications
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Create event with all options
- [ ] Join/leave free events
- [ ] Join paid events with different payment methods
- [ ] QR code ticket generation and scanning
- [ ] Points earning and spending
- [ ] VIP features (early access, VIP-only events)
- [ ] Chat functionality
- [ ] Push notifications
- [ ] Image uploads
- [ ] Event series creation
- [ ] Follow/unfollow users

### API Testing
Use tools like Postman or curl to test endpoints:
```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

---

## 📝 Code Style & Patterns

### Frontend
- **State Management:** Zustand stores in `src/store/`
- **API Calls:** Centralized in `src/api/` with typed functions
- **Components:** Feature-based organization in `src/features/`
- **Navigation:** Stack and tab navigators in `src/navigation/`
- **Theme:** Centralized theme in `src/theme/`

### Backend
- **Routes:** Express routers in `src/routes/`
- **Services:** Business logic in `src/services/`
- **Middleware:** Auth and error handling in `src/middleware/`
- **Validation:** Zod schemas for request validation
- **Error Handling:** Consistent error response format

---

## 🐛 Troubleshooting

### Common Issues

**"Network request failed"**
- Check backend is running
- Verify API_BASE_URL in `src/api/client.ts`
- For physical devices, use IP address instead of localhost

**"Authentication required"**
- Check JWT token is stored and sent
- Verify token hasn't expired
- Try logging out and back in

**Database connection errors**
- Verify DATABASE_URL in backend `.env`
- Check PostgreSQL is running
- Run `npm run db:push` to sync schema

**Stripe payment not working**
- Verify keys are set in environment
- Check development build (not Expo Go)
- See `STRIPE_SETUP.md` for Android build issues

**Push notifications not received**
- Check Expo project ID is set
- Verify push token is registered
- iOS requires development build

---

## 📞 Next Steps for Continuation

1. **Review current state:**
   - Check git status: `git status`
   - Review recent commits: `git log --oneline -10`
   - Test all major features

2. **Identify priorities:**
   - Review TODO comments in code
   - Check for any error logs
   - Review user feedback/issues

3. **Continue development:**
   - Follow existing code patterns
   - Update this document as features are added
   - Maintain documentation

4. **Before deploying:**
   - Set up production environment variables
   - Configure CORS properly
   - Set up database backups
   - Test payment flows thoroughly
   - Set up monitoring/logging

---

## 📌 Important Notes

- **Branch:** Currently on `cursor/ai-handover-file-fb0f`
- **Working Tree:** Clean (no uncommitted changes)
- **Database:** Uses Prisma migrations - always run migrations after schema changes
- **Payments:** Stripe is in test mode - switch to live keys for production
- **Notifications:** Expo push service works in development, may need EAS for production
- **Build:** Native features (Stripe, camera) require development build, not Expo Go

---

## 🎓 Key Concepts

### Payment Flow
1. User selects payment method (points/cash/card)
2. For card: Create Payment Intent → Show Payment Sheet → Verify → Join
3. For points: Validate balance → Deduct → Join
4. For cash: Calculate markup → Store price → Join

### Points System
- Earned when ticket is scanned (admittedAt is set)
- Can be used for paid events (full or partial)
- Refunded when leaving paid event
- VIP users earn double points

### VIP System
- Two tiers: `vip` and `vip_plus`
- Benefits: double points, early access, VIP-only events, curated picks
- Early access: events with `listFrom` date visible to VIPs before public

### Event Series
- Linked via `seriesId` (UUID of first event)
- `seriesInterval`: '1week' | '2weeks' | '3weeks' | '1month'
- `seriesIndex`: 0-based index in series

---

**End of Handover Document**

*This document should be updated as the project evolves. Keep it current with new features, changes, and known issues.*
