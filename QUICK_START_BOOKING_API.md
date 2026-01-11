# Quick Start: Booking System API

## Backend Setup

```bash
cd backend
npm install
npm run dev  # Port 4022
```

## Quick Test Commands

### 1. Create a Room Category
```bash
curl -X POST http://localhost:4022/room-categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": {"th": "ห้องดีลักซ์", "en": "Deluxe"},
    "slug": "deluxe",
    "order": 1
  }'
```

### 2. Create a Room Type
```bash
curl -X POST http://localhost:4022/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "name": {"th": "ห้องดีลักซ์ เตียงแฝด", "en": "Deluxe Room with Twin Beds"},
    "slug": "deluxe-twin-beds",
    "roomCode": "WBE-TH-2023-05-00007-202405100520300",
    "status": "published",
    "maxGuests": 3,
    "size": "32 sq mtr",
    "description": {
      "th": "ห้องพักที่เงียบสงบ...",
      "en": "A quiet space where light filters through softly drawn curtains..."
    },
    "shortDescription": {
      "th": "ห้องดีลักซ์ เตียงแฝด สำหรับ 3 ท่าน",
      "en": "Deluxe twin room for 3 guests"
    },
    "pricePerNight": 1500,
    "pricePerMonth": 35000,
    "totalRooms": 5,
    "beddingOptions": [
      {"type": "2 Queens", "description": {"th": "", "en": ""}},
      {"type": "2 Single", "description": {"th": "", "en": ""}}
    ],
    "facilities": {
      "bathroomFeatures": ["Bathtub", "Hand Soap", "Shower", "Toiletries", "Towels", "Vanity Basin & Mirror"],
      "climateControl": ["Air-conditioning"],
      "entertainment": ["Flat Screen TV", "Satellite / Cable TV"],
      "generalAmenities": ["Alarm Clock", "Bathrobes", "Daily Housekeeping", "Free Parking", "Hair Dryer", "Phone", "Room Slippers"],
      "internet": ["FREE WiFi", "Wireless / WiFi"],
      "kitchenFeatures": ["Electric Kettle", "Free Bottled Water", "POD Coffee machine", "Refrigerator - Bar Size"],
      "roomFeatures": ["Accessible by Elevator", "Bedside Lights", "Desk", "Electronic Door Lock", "In-room Safe Deposit Box", "Linen", "Non Smoking Rooms", "Windows"]
    }
  }'
```

### 3. Create Individual Rooms (Physical Rooms)
```bash
# Get the roomTypeId from step 2, then create 5 physical rooms

curl -X POST http://localhost:4022/individual-rooms \
  -H "Content-Type: application/json" \
  -d '{
    "roomTypeId": "<ROOM_TYPE_ID>",
    "roomNumber": "101",
    "floor": 1,
    "building": "Main Building",
    "status": "available"
  }'

# Repeat for rooms 102, 103, 104, 105
```

### 4. Create a Default Promo Code
```bash
curl -X POST http://localhost:4022/promo-codes \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME10",
    "name": {"th": "ส่วนลด 10%", "en": "10% Discount"},
    "description": {"th": "รับส่วนลด 10% สำหรับการจองครั้งแรก", "en": "Get 10% off your first booking"},
    "discountType": "percentage",
    "discountValue": 10,
    "isDefault": true,
    "status": "active",
    "minNights": 1,
    "minAmount": 0
  }'
```

### 5. Check Room Availability
```bash
curl "http://localhost:4022/availability?roomTypeId=<ROOM_TYPE_ID>&checkIn=2026-01-15&checkOut=2026-01-17"
```

### 6. Get Rooms with Availability
```bash
curl "http://localhost:4022/rooms?locale=en&checkIn=2026-01-15&checkOut=2026-01-17&status=published"
```

### 7. Create a Booking
```bash
curl -X POST http://localhost:4022/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "roomTypeId": "<ROOM_TYPE_ID>",
    "checkInDate": "2026-01-15",
    "checkOutDate": "2026-01-17",
    "guestName": "John Doe",
    "guestEmail": "john@example.com",
    "guestPhone": "+66812345678",
    "numberOfGuests": 2,
    "promoCode": "WELCOME10",
    "specialRequests": "Late check-in please"
  }'
```

### 8. Lookup Booking
```bash
curl "http://localhost:4022/bookings/lookup/BK202601070001"
```

### 9. List All Bookings (Admin)
```bash
curl "http://localhost:4022/bookings?status=confirmed"
```

---

## Response Examples

### Create Booking Response
```json
{
  "booking": {
    "id": "507f1f77bcf86cd799439011",
    "bookingNumber": "BK202601070001",
    "roomType": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Deluxe Room with Twin Beds"
    },
    "individualRoom": {
      "roomNumber": "101",
      "floor": 1
    },
    "checkInDate": "2026-01-15T00:00:00.000Z",
    "checkOutDate": "2026-01-17T00:00:00.000Z",
    "nights": 2,
    "guestName": "John Doe",
    "guestEmail": "john@example.com",
    "guestPhone": "+66812345678",
    "numberOfGuests": 2,
    "roomPrice": 3000,
    "discount": 300,
    "totalPrice": 2700,
    "status": "confirmed",
    "createdAt": "2026-01-07T10:30:00.000Z"
  }
}
```

### Availability Response
```json
{
  "roomTypeId": "507f1f77bcf86cd799439012",
  "checkIn": "2026-01-15T00:00:00.000Z",
  "checkOut": "2026-01-17T00:00:00.000Z",
  "availableRooms": 3,
  "isAvailable": true
}
```

### Promo Code Validation Response
```json
{
  "valid": true,
  "promoCode": {
    "code": "WELCOME10",
    "name": "10% Discount",
    "discountType": "percentage",
    "discountValue": 10
  },
  "discount": 300,
  "finalAmount": 2700
}
```

---

## Booking Flow Example

### Complete Flow from Search to Confirmation

1. **User selects dates** (Today → Tomorrow by default)
   - Frontend sets: checkIn = today, checkOut = tomorrow
   - User can modify dates

2. **Fetch available rooms**
   ```bash
   GET /rooms?locale=en&checkIn=2026-01-15&checkOut=2026-01-17&status=published
   ```

3. **User selects a room**
   - Display room details, facilities, pricing
   - Show "Available: 3 rooms"

4. **Get default promo code**
   ```bash
   GET /default-promo
   ```

5. **User enters booking details**
   - Name, email, phone
   - Number of guests
   - Promo code (pre-filled with default)
   - Special requests

6. **Validate promo code** (if user changed it)
   ```bash
   POST /validate-promo
   {
     "code": "WELCOME10",
     "roomTypeId": "...",
     "nights": 2,
     "totalAmount": 3000
   }
   ```

7. **Create booking**
   ```bash
   POST /bookings
   {
     "roomTypeId": "...",
     "checkInDate": "2026-01-15",
     "checkOutDate": "2026-01-17",
     "guestName": "John Doe",
     "guestEmail": "john@example.com",
     "guestPhone": "+66812345678",
     "numberOfGuests": 2,
     "promoCode": "WELCOME10",
     "specialRequests": "Late check-in"
   }
   ```

8. **Show confirmation**
   - Display booking number: BK202601070001
   - Show room details
   - Show total price with discount
   - Send confirmation email (TODO)

---

## Common Queries

### Get rooms by category
```bash
curl "http://localhost:4022/rooms?category=deluxe&locale=en"
```

### Search bookings by guest
```bash
curl "http://localhost:4022/bookings?q=john@example.com"
```

### Get bookings for date range
```bash
curl "http://localhost:4022/bookings?from=2026-01-01&to=2026-01-31"
```

### Get active promo codes
```bash
curl "http://localhost:4022/promo-codes/active?locale=en"
```

---

## Error Handling

### No rooms available
```json
{
  "error": "No rooms available for the selected dates"
}
```

### Invalid promo code
```json
{
  "error": "Invalid promo code"
}
```

### Validation errors
```json
{
  "error": "Missing required fields"
}
```

---

## Next Steps

1. Test all endpoints with the commands above
2. Verify availability logic by creating overlapping bookings
3. Test promo code validation with different scenarios
4. Build frontend components to consume these APIs
5. Build admin dashboard for managing rooms and bookings

---

## MongoDB Data Check

```bash
# Connect to MongoDB
mongosh

# Use your database
use air-con-service-v1

# Check collections
db.rooms.find()
db.individualrooms.find()
db.bookings.find()
db.promocodes.find()
db.roomcategories.find()
```

---

**Ready to start building the frontend!**
