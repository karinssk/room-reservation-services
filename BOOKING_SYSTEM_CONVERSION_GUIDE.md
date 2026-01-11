# Room Reservation System - Conversion Guide

## Overview
This guide documents the conversion from an Air Conditioning Services platform to a **Room Reservation Services** platform (Daily & Monthly bookings).

## Status: Backend Complete ✅

### What's Been Implemented

#### 1. Database Models (All Complete)

**New Models Created:**
- `Room.js` - Room types with facilities, pricing, multi-language support
- `IndividualRoom.js` - Physical room tracking (Room 101, 102, etc.)
- `Booking.js` - Reservation/booking with auto-generated booking numbers
- `PromoCode.js` - Promotional discount codes with validation logic
- `RoomCategory.js` - Room categories (Standard, Deluxe, Suite, etc.)

**Key Features:**
- Multi-language support (Thai/English) for all customer-facing content
- Individual room tracking for preventing double bookings
- Auto-generated booking numbers (e.g., BK202601070001)
- Promo code validation with usage limits and restrictions
- Availability checking algorithm

#### 2. Backend API Routes (All Complete)

**New Routes Created:**

**`/backend/routes/rooms.js`** - Complete room management
- `GET /room-categories` - List all room categories
- `POST /room-categories` - Create category
- `PUT /room-categories/:id` - Update category
- `DELETE /room-categories/:id` - Delete category
- `GET /rooms` - List rooms (with availability check via query params)
- `GET /rooms/:slug` - Get single room
- `POST /rooms` - Create room
- `PUT /rooms/:id` - Update room
- `DELETE /rooms/:id` - Delete room
- `GET /rooms/:roomTypeId/individual-rooms` - List physical rooms
- `POST /individual-rooms` - Create physical room
- `PUT /individual-rooms/:id` - Update physical room
- `DELETE /individual-rooms/:id` - Delete physical room

**`/backend/routes/bookings.js`** - Complete booking management
- `GET /availability` - Check room availability for date range
- `GET /default-promo` - Get default promo code
- `POST /validate-promo` - Validate promo code
- `POST /bookings` - Create new booking (PUBLIC)
- `GET /bookings/lookup/:bookingNumber` - Lookup booking (PUBLIC)
- `GET /bookings` - List all bookings (ADMIN)
- `GET /bookings/:id` - Get single booking (ADMIN)
- `PUT /bookings/:id` - Update booking (ADMIN)
- `DELETE /bookings/:id` - Delete booking (ADMIN)

**`/backend/routes/promoCodes.js`** - Promo code management
- `GET /promo-codes/active` - Get active promo codes (PUBLIC)
- `GET /promo-codes` - List all promo codes (ADMIN)
- `GET /promo-codes/:id` - Get single promo code (ADMIN)
- `POST /promo-codes` - Create promo code (ADMIN)
- `PUT /promo-codes/:id` - Update promo code (ADMIN)
- `DELETE /promo-codes/:id` - Delete promo code (ADMIN)
- `POST /promo-codes/:id/reset-usage` - Reset usage count (ADMIN)

**Routes Registered in** `backend/index.js` ✅

---

## New Booking Flow Design

### Customer Journey:

```
1. Browse Rooms Page
   ↓
2. Date Selection Widget (Default: Today → Tomorrow)
   - Check-in date (editable)
   - Check-out date (editable)
   - Show available rooms dynamically
   ↓
3. Room Selection
   - Display rooms with availability
   - Show pricing, facilities, images
   - Filter by category, guests, price
   ↓
4. Booking Form
   - Guest name, email, phone
   - Number of guests
   - Default promo code pre-applied (can modify)
   - Special requests
   ↓
5. Instant Confirmation
   - Booking number displayed
   - Confirmation email sent
   - Calendar event created
   - Admin notification via Socket.io
```

---

## Room Data Structure

Based on your example (Deluxe Room with Twin Beds), here's the complete structure:

```javascript
{
  // Basic Info
  name: { th: "ห้องดีลักซ์ เตียงแฝด", en: "Deluxe Room with Twin Beds" },
  slug: "deluxe-twin-beds",
  roomCode: "WBE-TH-2023-05-00007-202405100520300",
  status: "published",

  // Room Details
  maxGuests: 3,
  size: "32 sq mtr",
  description: {
    th: "...",
    en: "A quiet space where light filters through softly drawn curtains..."
  },

  // Pricing
  pricePerNight: 1500,
  pricePerMonth: 35000,

  // Media
  coverImage: "/uploads/rooms/deluxe-twin-cover.jpg",
  gallery: ["/uploads/rooms/deluxe-twin-1.jpg", ...],

  // Bedding Options
  beddingOptions: [
    { type: "2 Queens", description: { th: "", en: "" } },
    { type: "2 Single", description: { th: "", en: "" } }
  ],

  // Facilities (7 categories)
  facilities: {
    bathroomFeatures: [
      "Bathtub",
      "Hand Soap",
      "Shower",
      "Shower Over Bath",
      "Toiletries",
      "Towels",
      "Vanity Basin & Mirror"
    ],
    climateControl: ["Air-conditioning"],
    entertainment: [
      "Flat Screen TV",
      "Satellite / Cable TV",
      "TV"
    ],
    generalAmenities: [
      "Alarm Clock",
      "Bathrobes",
      "Daily Housekeeping",
      "Free Parking",
      "Hair Dryer",
      "Parking",
      "Phone",
      "Room Slippers"
    ],
    internet: ["FREE WiFi", "Wireless / WiFi"],
    kitchenFeatures: [
      "Electric Kettle",
      "Free Bottled Water",
      "Free Tea/Coffee Making facilities",
      "POD Coffee machine",
      "Refrigerator - Bar Size",
      "Tea/Coffee Making facilities"
    ],
    roomFeatures: [
      "Accessible by Elevator",
      "Bedside Lights",
      "Blinds",
      "Desk",
      "Electronic Door Lock",
      "In-room Safe Deposit Box",
      "Linen",
      "Non Smoking Rooms",
      "Pets Allowed",
      "Power",
      "Privacy Curtains",
      "Smoke Alarm",
      "Windows"
    ]
  },

  // Inventory
  totalRooms: 5, // 5 physical rooms of this type

  // SEO
  seo: {
    title: { th: "", en: "" },
    description: { th: "", en: "" },
    image: ""
  }
}
```

---

## API Usage Examples

### 1. Check Room Availability
```bash
GET /availability?roomTypeId=507f1f77bcf86cd799439011&checkIn=2026-01-15&checkOut=2026-01-17

Response:
{
  "roomTypeId": "507f1f77bcf86cd799439011",
  "checkIn": "2026-01-15T00:00:00.000Z",
  "checkOut": "2026-01-17T00:00:00.000Z",
  "availableRooms": 3,
  "isAvailable": true
}
```

### 2. Get Rooms with Availability
```bash
GET /rooms?locale=en&checkIn=2026-01-15&checkOut=2026-01-17

Response:
{
  "rooms": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Deluxe Room with Twin Beds",
      "pricePerNight": 1500,
      "availableRooms": 3,
      ...
    }
  ]
}
```

### 3. Create Booking
```bash
POST /bookings
{
  "roomTypeId": "507f1f77bcf86cd799439011",
  "checkInDate": "2026-01-15",
  "checkOutDate": "2026-01-17",
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "guestPhone": "+66812345678",
  "numberOfGuests": 2,
  "promoCode": "WELCOME10",
  "specialRequests": "Late check-in please"
}

Response:
{
  "booking": {
    "id": "...",
    "bookingNumber": "BK202601070001",
    "roomType": { "id": "...", "name": "Deluxe Room with Twin Beds" },
    "individualRoom": { "roomNumber": "101", "floor": 1 },
    "checkInDate": "2026-01-15T00:00:00.000Z",
    "checkOutDate": "2026-01-17T00:00:00.000Z",
    "nights": 2,
    "totalPrice": 2700,
    "discount": 300,
    "status": "confirmed"
  }
}
```

### 4. Validate Promo Code
```bash
POST /validate-promo
{
  "code": "WELCOME10",
  "roomTypeId": "507f1f77bcf86cd799439011",
  "nights": 2,
  "totalAmount": 3000
}

Response:
{
  "valid": true,
  "promoCode": {
    "code": "WELCOME10",
    "discountType": "percentage",
    "discountValue": 10
  },
  "discount": 300,
  "finalAmount": 2700
}
```

---

## Promo Code Features

### Default Promo Code
- Set `isDefault: true` to auto-apply a promo code
- Only one promo code can be default at a time
- Fetched via `GET /default-promo` endpoint

### Promo Code Restrictions
- **Time-based**: `validFrom`, `validTo`
- **Usage limits**: `maxUses`, `maxUsesPerUser`
- **Booking requirements**: `minNights`, `minAmount`
- **Room restrictions**: `applicableRoomTypes` array

### Discount Types
- **Percentage**: e.g., 10% off (`discountType: "percentage", discountValue: 10`)
- **Fixed**: e.g., 500 THB off (`discountType: "fixed", discountValue: 500`)

---

## Individual Room Tracking

### How It Works
1. When creating a room type (e.g., Deluxe Twin), set `totalRooms: 5`
2. Manually create 5 individual rooms:
   - Room 101, 102, 103, 104, 105
   - Each linked to the same `roomTypeId`
3. When a booking is made:
   - System finds an available individual room for those dates
   - Assigns it to the booking
   - Room is blocked for overlapping dates

### Room Status
- `available` - Ready for booking
- `occupied` - Currently occupied by guest
- `maintenance` - Under maintenance
- `cleaning` - Being cleaned

---

## Availability Algorithm

### How It Works
1. Get total rooms of a specific type (e.g., 5 Deluxe Twins)
2. Count overlapping bookings for the requested date range
3. A booking overlaps if:
   - Its check-in < requested check-out, AND
   - Its check-out > requested check-in
4. Available rooms = Total rooms - Overlapping bookings

### Example
- Deluxe Twin: 5 total rooms
- Date request: Jan 15-17
- Existing bookings overlapping Jan 15-17: 2
- Available: 5 - 2 = 3 rooms

---

## What Still Needs to Be Done

### 1. Google Calendar Integration
- [ ] Update `backend/routes/calendar.js` to handle bookings
- [ ] Create calendar events when booking is created
- [ ] Update calendar events when booking is modified
- [ ] Delete calendar events when booking is cancelled
- [ ] Sync booking status with calendar

### 2. Admin Interface
- [ ] Room management page (CRUD operations)
- [ ] Individual rooms management
- [ ] Booking management dashboard
- [ ] Calendar view of bookings
- [ ] Promo code management page
- [ ] Booking reports and analytics

### 3. Frontend Booking Flow
- [ ] Date picker component (check-in/check-out)
- [ ] Room listing page with availability
- [ ] Room detail page with booking form
- [ ] Booking confirmation page
- [ ] Booking lookup page (by booking number)
- [ ] My bookings page (for registered users)

### 4. Notifications
- [ ] Email confirmation to guest
- [ ] Email notification to admin
- [ ] Socket.io real-time notification to admin dashboard
- [ ] Reminder emails (before check-in)

### 5. Additional Features
- [ ] Payment gateway integration
- [ ] Reviews and ratings
- [ ] Room comparison tool
- [ ] Booking modification/cancellation
- [ ] Google Sheets sync for booking data
- [ ] Multi-currency support

---

## Migration Strategy

### Option 1: Keep Old System Running
- Keep Services and Products models
- Run both systems in parallel
- Gradually transition content

### Option 2: Full Migration
- Create migration script to convert:
  - Services → Rooms
  - Service Categories → Room Categories
- Archive old data
- Switch routes

### Recommended: Option 1
Since you chose to "Keep for later use" for Products, I recommend:
1. Keep both systems active
2. Create new admin sections for Rooms & Bookings
3. Maintain Services/Products for now
4. Gradually phase out if not needed

---

## Testing Checklist

### Backend Testing
- [ ] Create room categories
- [ ] Create rooms with facilities
- [ ] Create individual rooms
- [ ] Check room availability
- [ ] Create promo codes
- [ ] Validate promo codes
- [ ] Create bookings
- [ ] Test double-booking prevention
- [ ] Test booking updates
- [ ] Test booking cancellations

### API Testing Examples
```bash
# Start backend
cd backend && npm run dev

# Test room creation
curl -X POST http://localhost:4022/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "name": {"th": "ห้องดีลักซ์", "en": "Deluxe Room"},
    "slug": "deluxe-room",
    "pricePerNight": 1500,
    "totalRooms": 5,
    "status": "published"
  }'

# Test availability
curl "http://localhost:4022/availability?roomTypeId=<ID>&checkIn=2026-01-15&checkOut=2026-01-17"

# Test booking creation
curl -X POST http://localhost:4022/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "roomTypeId": "<ID>",
    "checkInDate": "2026-01-15",
    "checkOutDate": "2026-01-17",
    "guestName": "Test User",
    "guestEmail": "test@example.com",
    "guestPhone": "+66812345678"
  }'
```

---

## File Structure

### New Files Created
```
backend/
├── models/
│   ├── Room.js                 ✅ New
│   ├── IndividualRoom.js       ✅ New
│   ├── Booking.js              ✅ New
│   ├── PromoCode.js            ✅ New
│   └── RoomCategory.js         ✅ New
├── routes/
│   ├── rooms.js                ✅ New
│   ├── bookings.js             ✅ New
│   └── promoCodes.js           ✅ New
└── index.js                    ✅ Updated
```

### Existing Files (Kept)
```
backend/
├── models/
│   ├── Service.js              ✓ Kept for reference
│   ├── Product.js              ✓ Kept for future use
│   └── QuotationRequest.js     ✓ Kept (or convert to Booking)
└── routes/
    ├── services.js             ✓ Kept
    └── products.js             ✓ Kept
```

---

## Next Steps

### Immediate Actions
1. Test the backend APIs using Postman or curl
2. Create sample room data in database
3. Create sample promo codes
4. Test booking flow end-to-end

### Short-term
1. Build admin interface for room management
2. Build admin interface for booking management
3. Integrate Google Calendar

### Medium-term
1. Build frontend booking flow
2. Add email notifications
3. Add payment integration

---

## API Endpoint Summary

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/room-categories` | List categories | Public |
| POST | `/room-categories` | Create category | Admin |
| GET | `/rooms` | List rooms | Public |
| GET | `/rooms/:slug` | Get room details | Public |
| POST | `/rooms` | Create room | Admin |
| GET | `/availability` | Check availability | Public |
| GET | `/default-promo` | Get default promo | Public |
| POST | `/validate-promo` | Validate promo code | Public |
| POST | `/bookings` | Create booking | Public |
| GET | `/bookings/lookup/:number` | Lookup booking | Public |
| GET | `/bookings` | List all bookings | Admin |
| GET | `/bookings/:id` | Get booking details | Admin |
| PUT | `/bookings/:id` | Update booking | Admin |
| GET | `/promo-codes` | List promo codes | Admin |
| POST | `/promo-codes` | Create promo code | Admin |

---

## Notes

- **Multi-language**: All customer-facing content supports Thai/English
- **Instant Confirmation**: Bookings are auto-confirmed (no manual approval needed)
- **Individual Room Tracking**: Prevents double-bookings by tracking physical rooms
- **Promo Codes**: Support both percentage and fixed discounts with restrictions
- **Availability Check**: Real-time availability calculation on every query
- **Booking Numbers**: Auto-generated format `BK{YYYYMMDD}{0001}`

---

## Support & Questions

For questions or issues during implementation:
1. Check the API endpoint documentation above
2. Review the model schemas in `backend/models/`
3. Test endpoints using the examples provided
4. Check console logs for errors

---

**Status**: Backend implementation complete. Ready for frontend and admin interface development.

**Last Updated**: 2026-01-07
