# Backend Changes Summary for Payment Feature

## Overview
The backend has been updated to support payment methods for paid events: points (full/partial), cash (with markup), and credit card.

## Changes Made

### 1. Database Schema (`backend/prisma/schema.prisma`)
**Added to `EventAttendee` model:**
- `paymentMethod`: String? - Payment method used ('points', 'cash', 'credit_card')
- `pointsUsed`: Int? - Points deducted for this payment
- `cashPrice`: Float? - Final price if cash payment (includes 12.5% markup)
- `creditCardPrice`: Float? - Final price if credit card payment

### 2. Route Update (`backend/src/routes/events.ts`)
**Added validation schema:**
- `joinEventSchema` - Validates payment method and points amount

**Updated `/events/:id/join` endpoint:**
- Now accepts optional `paymentMethod` and `pointsAmount` in request body
- Passes payment parameters to service layer

### 3. Service Update (`backend/src/services/events.ts`)
**Updated `joinEvent` function:**
- Accepts `paymentMethod` and `pointsAmount` parameters
- Validates payment for paid events
- Calculates final price based on payment method:
  - **Points**: Deducts from user balance, validates sufficient points
  - **Cash**: Applies 12.5% markup (average of 10-15%)
  - **Credit Card**: Uses base price
  - **Partial Points**: Deducts points, charges remaining to credit card
- Stores payment information in EventAttendee record

**Updated `leaveEvent` function:**
- Refunds points if payment was made with points
- Prevents point loss when users leave paid events

## Payment Logic Details

### Points Payment
- Validates user has sufficient points
- Deducts points from user balance
- Supports partial payment (remaining charged to credit card)

### Cash Payment
- Applies 12.5% markup to base price
- Stores cash price for collection at event
- No immediate payment processing

### Credit Card Payment
- Uses base price (no markup)
- Stores credit card price for payment processing
- Note: Actual payment gateway integration needed for production

## Next Steps

1. **Run Database Migration:**
   ```bash
   cd backend
   npx prisma migrate dev --name add_payment_fields_to_event_attendees
   npx prisma generate
   ```

2. **Test the Implementation:**
   - Test joining paid events with each payment method
   - Test partial points payment
   - Test leaving paid events (points refund)

3. **Future Enhancements:**
   - Integrate actual payment gateway for credit card payments
   - Add payment history/transaction records
   - Add admin dashboard for payment tracking
   - Handle payment refunds for cancelled events

## API Request Examples

### Join with Points (Full)
```json
POST /events/{eventId}/join
{
  "paymentMethod": "points",
  "pointsAmount": 100
}
```

### Join with Points (Partial)
```json
POST /events/{eventId}/join
{
  "paymentMethod": "points",
  "pointsAmount": 50
}
```

### Join with Cash
```json
POST /events/{eventId}/join
{
  "paymentMethod": "cash"
}
```

### Join with Credit Card
```json
POST /events/{eventId}/join
{
  "paymentMethod": "credit_card"
}
```

### Join Free Event (No Payment)
```json
POST /events/{eventId}/join
{}
```
