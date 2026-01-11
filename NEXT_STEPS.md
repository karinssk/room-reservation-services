# 🎯 Next Steps - Frontend Development Guide

## Overview
The backend and admin interface are complete! Now you need to build the customer-facing frontend booking flow.

---

## 🚀 Quick Start Testing

### 1. Start Both Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Admin
cd admin
npm run dev

# Terminal 3 - Frontend (when ready)
cd frontend
npm run dev
```

### 2. Access Admin Interface
- Rooms: http://localhost:4021/rooms
- Bookings: http://localhost:4021/bookings
- Promo Codes: http://localhost:4021/promo-codes

### 3. Test the APIs
```bash
# Check health
curl http://localhost:4022/health

# Get rooms
curl http://localhost:4022/rooms?locale=en

# Check availability
curl "http://localhost:4022/availability?roomTypeId=<ID>&checkIn=2026-01-15&checkOut=2026-01-17"
```

---

## 📝 Frontend Pages to Build

### Priority 1: Core Booking Flow

#### 1. **Date Selection Component**
**Location**: `frontend/components/DatePicker.tsx`
**Features**:
- Default: checkIn = today, checkOut = tomorrow
- User can modify both dates
- Visual calendar picker
- Min date = today
- Validate checkOut > checkIn

**Libraries to use**:
- `react-datepicker` or `react-day-picker`
- State management with React hooks

**Example**:
```typescript
const [checkIn, setCheckIn] = useState(new Date());
const [checkOut, setCheckOut] = useState(
  new Date(Date.now() + 86400000) // Tomorrow
);
```

#### 2. **Rooms Listing Page**
**Location**: `frontend/app/rooms/page.tsx`
**URL**: `/rooms?checkIn=2026-01-15&checkOut=2026-01-17`

**Features**:
- Show date picker at top
- Fetch rooms with availability: `GET /rooms?locale=en&checkIn=...&checkOut=...`
- Display room cards with:
  - Cover image
  - Name
  - Price per night
  - Available rooms count
  - Max guests
  - "View Details" button
- Filter by category
- Sort by price

**API Call**:
```typescript
const response = await fetch(
  `${API_URL}/rooms?locale=en&checkIn=${checkIn}&checkOut=${checkOut}&status=published`
);
const { rooms } = await response.json();
```

#### 3. **Room Detail + Booking Form**
**Location**: `frontend/app/rooms/[slug]/page.tsx`
**URL**: `/rooms/deluxe-twin-beds?checkIn=2026-01-15&checkOut=2026-01-17`

**Features**:
- Display full room details:
  - Gallery slider
  - Description
  - Facilities (all 7 categories)
  - Bedding options
  - Pricing
- Show booking form with:
  - Guest name (required)
  - Guest email (required)
  - Guest phone (required)
  - Number of guests (dropdown)
  - Promo code field (pre-filled with default)
  - Special requests (textarea)
  - Price breakdown
  - "Book Now" button

**API Calls**:
```typescript
// Get room details
GET /rooms/${slug}?locale=en

// Get default promo code
GET /default-promo

// Validate promo code (when user changes it)
POST /validate-promo
{
  code: "WELCOME10",
  roomTypeId: room.id,
  nights: 2,
  totalAmount: 3000
}

// Create booking
POST /bookings
{
  roomTypeId: room.id,
  checkInDate: "2026-01-15",
  checkOutDate: "2026-01-17",
  guestName: "John Doe",
  guestEmail: "john@example.com",
  guestPhone: "+66812345678",
  numberOfGuests: 2,
  promoCode: "WELCOME10",
  specialRequests: "Late check-in please"
}
```

#### 4. **Booking Confirmation Page**
**Location**: `frontend/app/booking-confirmation/page.tsx`
**URL**: `/booking-confirmation?bookingNumber=BK202601070001`

**Features**:
- Show success message
- Display booking number (large, bold)
- Show booking summary:
  - Room name
  - Dates
  - Guest info
  - Price
- Download/Print button
- "Back to Home" button

**API Call**:
```typescript
GET /bookings/lookup/${bookingNumber}
```

#### 5. **Booking Lookup Page**
**Location**: `frontend/app/my-booking/page.tsx`
**URL**: `/my-booking`

**Features**:
- Input field for booking number
- "Look Up" button
- Display booking details when found
- Show error if not found

---

### Priority 2: Additional Pages

#### 6. **Homepage with Date Picker**
**Location**: `frontend/app/page.tsx`

**Features**:
- Hero section with date picker
- Featured rooms
- "Check Availability" button → redirects to `/rooms?checkIn=...&checkOut=...`

#### 7. **All Rooms Page** (without dates)
**Location**: `frontend/app/all-rooms/page.tsx`

**Features**:
- Show all published rooms
- No availability checking
- "Check Availability" button opens date picker

---

## 🎨 UI Components to Create

### Reusable Components

1. **DateRangePicker.tsx**
   - Check-in and check-out date selection
   - Default to today → tomorrow
   - Props: `onDatesChange(checkIn, checkOut)`

2. **RoomCard.tsx**
   - Room thumbnail
   - Name, price, guests
   - Availability badge
   - "View Details" button

3. **BookingForm.tsx**
   - Guest information fields
   - Promo code input with validation
   - Price breakdown display
   - Submit button

4. **FacilitiesList.tsx**
   - Display all 7 facility categories
   - Icons for each facility
   - Collapsible sections

5. **PriceBreakdown.tsx**
   - Room price
   - Discount (if promo code)
   - Total price
   - Number of nights

---

## 🔧 Frontend State Management

### Option 1: React Context (Simple)
```typescript
// BookingContext.tsx
const BookingContext = createContext({
  checkIn: new Date(),
  checkOut: new Date(Date.now() + 86400000),
  selectedRoom: null,
  promoCode: null,
  setCheckIn: () => {},
  setCheckOut: () => {},
  setSelectedRoom: () => {},
  setPromoCode: () => {},
});
```

### Option 2: Zustand (Recommended)
```typescript
// store/bookingStore.ts
import create from 'zustand';

const useBookingStore = create((set) => ({
  checkIn: new Date(),
  checkOut: new Date(Date.now() + 86400000),
  selectedRoom: null,
  promoCode: null,
  setDates: (checkIn, checkOut) => set({ checkIn, checkOut }),
  setSelectedRoom: (room) => set({ selectedRoom: room }),
  setPromoCode: (code) => set({ promoCode: code }),
}));
```

---

## 📦 NPM Packages You'll Need

```bash
cd frontend
npm install --save \
  react-datepicker \
  @types/react-datepicker \
  date-fns \
  zustand \
  react-hook-form \
  zod \
  swiper \
  react-hot-toast
```

**Packages explained**:
- `react-datepicker` - Date picker component
- `date-fns` - Date formatting utilities
- `zustand` - State management
- `react-hook-form` - Form handling
- `zod` - Form validation
- `swiper` - Image gallery slider
- `react-hot-toast` - Toast notifications

---

## 🎯 Booking Flow Example Code

### Step 1: Date Picker on Homepage
```typescript
// frontend/app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DateRangePicker from "@/components/DateRangePicker";

export default function HomePage() {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(new Date());
  const [checkOut, setCheckOut] = useState(
    new Date(Date.now() + 86400000)
  );

  const handleSearch = () => {
    const checkInStr = checkIn.toISOString().split("T")[0];
    const checkOutStr = checkOut.toISOString().split("T")[0];
    router.push(`/rooms?checkIn=${checkInStr}&checkOut=${checkOutStr}`);
  };

  return (
    <div>
      <h1>Find Your Perfect Room</h1>
      <DateRangePicker
        checkIn={checkIn}
        checkOut={checkOut}
        onCheckInChange={setCheckIn}
        onCheckOutChange={setCheckOut}
      />
      <button onClick={handleSearch}>Check Availability</button>
    </div>
  );
}
```

### Step 2: Rooms Listing
```typescript
// frontend/app/rooms/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import RoomCard from "@/components/RoomCard";

export default function RoomsPage() {
  const searchParams = useSearchParams();
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    fetchRooms();
  }, [checkIn, checkOut]);

  const fetchRooms = async () => {
    const url = `${API_URL}/rooms?locale=en&checkIn=${checkIn}&checkOut=${checkOut}&status=published`;
    const res = await fetch(url);
    const data = await res.json();
    setRooms(data.rooms);
  };

  return (
    <div>
      <h1>Available Rooms</h1>
      <p>
        {checkIn} to {checkOut}
      </p>
      <div className="grid grid-cols-3 gap-4">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            checkIn={checkIn}
            checkOut={checkOut}
          />
        ))}
      </div>
    </div>
  );
}
```

### Step 3: Booking Form
```typescript
// frontend/app/rooms/[slug]/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RoomDetailPage({ params }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    numberOfGuests: 1,
    promoCode: "WELCOME10", // Default
    specialRequests: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const booking = {
      roomTypeId: room.id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      ...formData,
    };

    const res = await fetch(`${API_URL}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/booking-confirmation?bookingNumber=${data.booking.bookingNumber}`);
    } else {
      alert("Booking failed");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit">Complete Booking</button>
    </form>
  );
}
```

---

## 🎨 Design Tips

### Color Scheme (Match Admin)
- Primary: `bg-blue-600` / `text-blue-600`
- Success: `bg-green-600` / `text-green-600`
- Warning: `bg-yellow-600` / `text-yellow-600`
- Error: `bg-red-600` / `text-red-600`
- Gray: `bg-slate-50` / `text-slate-900`

### Typography
- Headings: `font-bold text-2xl`
- Body: `text-base text-slate-700`
- Small: `text-sm text-slate-500`

### Spacing
- Sections: `mb-8`
- Cards: `p-6 rounded-2xl`
- Gaps: `gap-4`

---

## ✅ Testing Checklist

### Booking Flow Testing
- [ ] Date picker displays with today → tomorrow default
- [ ] User can change dates
- [ ] Rooms list shows available rooms
- [ ] Room detail shows correct info
- [ ] Default promo code is pre-filled
- [ ] Promo code validation works
- [ ] Booking form validation works
- [ ] Booking submits successfully
- [ ] Confirmation page shows booking number
- [ ] Booking appears in admin interface
- [ ] Google Calendar event is created
- [ ] Booking lookup works

### Edge Cases
- [ ] No rooms available message
- [ ] Invalid promo code message
- [ ] Past dates blocked
- [ ] Check-out before check-in blocked
- [ ] Required fields validation
- [ ] Invalid email format blocked
- [ ] API errors handled gracefully

---

## 🚀 Deployment Checklist

### Environment Variables
```bash
# Backend .env
MONGO_URI=mongodb://...
BOOKING_CALENDAR_ID=primary
GOOGLE_SERVICE_ACCOUNT=./config/google.json

# Frontend .env.local
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Production Steps
1. [ ] Test all features locally
2. [ ] Update environment variables
3. [ ] Deploy backend to server
4. [ ] Deploy admin to subdomain
5. [ ] Deploy frontend to main domain
6. [ ] Test production booking flow
7. [ ] Monitor logs for errors
8. [ ] Set up email notifications
9. [ ] Set up backups
10. [ ] Launch! 🎉

---

## 📚 Additional Resources

### Documentation
- `BOOKING_SYSTEM_CONVERSION_GUIDE.md` - Complete system docs
- `QUICK_START_BOOKING_API.md` - API testing examples
- `IMPLEMENTATION_COMPLETE_SUMMARY.md` - What's been built

### Code Examples
- Admin pages: `admin/app/rooms/`, `admin/app/bookings/`
- Backend routes: `backend/routes/rooms.js`, `backend/routes/bookings.js`
- Models: `backend/models/Room.js`, `backend/models/Booking.js`

---

## 💡 Pro Tips

1. **Use URL params for dates**: Keep check-in/check-out in URL for sharing
2. **Show loading states**: Better UX during API calls
3. **Implement debouncing**: For promo code validation
4. **Add image optimization**: Use Next.js Image component
5. **Mobile-first design**: Most bookings happen on mobile
6. **Add analytics**: Track booking funnel
7. **SEO**: Add meta tags for each room
8. **Performance**: Lazy load images and components

---

## 🎯 Success Criteria

Your frontend is complete when:
- ✅ User can select dates
- ✅ User can view available rooms
- ✅ User can see room details and facilities
- ✅ User can fill booking form
- ✅ Default promo code is applied
- ✅ User can submit booking
- ✅ User receives confirmation
- ✅ Booking appears in admin
- ✅ Calendar event is created
- ✅ User can lookup booking

---

## 🎉 You're Ready!

Everything you need to build the frontend is ready:
- ✅ Complete backend API
- ✅ Admin interface for testing
- ✅ Documentation and examples
- ✅ Room availability system
- ✅ Promo code system
- ✅ Calendar integration

**Just build the customer-facing pages and you're done!**

Good luck! 🚀
