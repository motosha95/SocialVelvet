# Payment Implementation Guide

## Overview
This document outlines the backend changes needed to support payment methods for paid events:
- Points payment (full or partial)
- Cash payment (10-15% markup)
- Credit card payment

## Required Changes

### 1. Database Schema Update
Add payment fields to `EventAttendee` model:
- `paymentMethod`: 'points' | 'cash' | 'credit_card'
- `pointsUsed`: number (points deducted)
- `cashPrice`: number (final price if cash, includes markup)
- `creditCardPrice`: number (final price if credit card)

### 2. Route Update (`backend/src/routes/events.ts`)
Update the `/events/:id/join` endpoint to accept:
```typescript
{
  paymentMethod?: 'points' | 'cash' | 'credit_card',
  pointsAmount?: number
}
```

### 3. Service Update (`backend/src/services/events.ts`)
Update `joinEvent` function to:
- Validate payment method for paid events
- Calculate final price based on payment method (cash markup)
- Deduct points if using points payment
- Store payment information in EventAttendee
- Handle partial payment (points + credit card)

### 4. Payment Logic
- **Points**: Deduct from user's balance, validate sufficient points
- **Cash**: Store cash price (base price + 12.5% markup), mark as cash payment
- **Credit Card**: Store credit card price (base price), mark for payment processing
- **Partial Points**: Deduct points, charge remaining to credit card
