"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { backendBaseUrl } from "@/lib/urls";

const API_URL = backendBaseUrl;

type Booking = {
  bookingNumber: string;
  roomType: {
    name: string;
    coverImage?: string;
  };
  individualRoom?: {
    roomNumber: string;
    floor: number;
  };
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestName: string;
  numberOfGuests: number;
  totalPrice: number;
  status: string;
  specialRequests?: string;
  createdAt: string;
};

export default function MyBookingPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [bookingNumber, setBookingNumber] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingNumber.trim()) return;

    setLoading(true);
    setError("");
    setBooking(null);

    try {
      const res = await fetch(
        `${API_URL}/bookings/lookup/${bookingNumber.trim()}`
      );
      if (!res.ok) {
        setError("Booking not found. Please check your booking number and try again.");
        return;
      }
      const data = await res.json();
      setBooking(data.booking);
    } catch (error) {
      console.error("Failed to lookup booking:", error);
      setError("Failed to lookup booking. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      confirmed: "bg-blue-100 text-blue-700",
      "checked-in": "bg-green-100 text-green-700",
      "checked-out": "bg-gray-100 text-gray-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">
            Find My Booking
          </h1>
          <p className="text-slate-600">
            Enter your booking number to view your reservation details
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
        >
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Booking Number
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={bookingNumber}
              onChange={(e) => setBookingNumber(e.target.value.toUpperCase())}
              placeholder="BK202601070001"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !bookingNumber.trim()}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            You can find your booking number in your confirmation email
          </p>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-8 rounded-xl bg-red-50 p-4 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Booking Details */}
        {booking && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            {/* Status Badge */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Booking Details
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(
                  booking.status
                )}`}
              >
                {booking.status}
              </span>
            </div>

            {/* Booking Number */}
            <div className="mb-6 rounded-xl bg-blue-50 p-4">
              <div className="text-sm text-blue-600">Booking Number</div>
              <div className="text-xl font-bold text-blue-900">
                {booking.bookingNumber}
              </div>
            </div>

            {/* Guest Information */}
            <div className="mb-6 border-b border-slate-100 pb-6">
              <h3 className="mb-3 font-semibold text-slate-900">
                Guest Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Name:</span>
                  <span className="font-semibold text-slate-900">
                    {booking.guestName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Guests:</span>
                  <span className="font-semibold text-slate-900">
                    {booking.numberOfGuests}{" "}
                    {booking.numberOfGuests === 1 ? "guest" : "guests"}
                  </span>
                </div>
              </div>
            </div>

            {/* Room Information */}
            <div className="mb-6 border-b border-slate-100 pb-6">
              <h3 className="mb-3 font-semibold text-slate-900">
                Room Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Room Type:</span>
                  <span className="font-semibold text-slate-900">
                    {booking.roomType.name}
                  </span>
                </div>
                {booking.individualRoom && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Room Number:</span>
                    <span className="font-semibold text-slate-900">
                      {booking.individualRoom.roomNumber} (Floor{" "}
                      {booking.individualRoom.floor})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stay Dates */}
            <div className="mb-6 border-b border-slate-100 pb-6">
              <h3 className="mb-3 font-semibold text-slate-900">Stay Dates</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Check-in:</span>
                  <span className="font-semibold text-slate-900">
                    {formatDate(booking.checkInDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Check-out:</span>
                  <span className="font-semibold text-slate-900">
                    {formatDate(booking.checkOutDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Duration:</span>
                  <span className="font-semibold text-slate-900">
                    {booking.nights} {booking.nights === 1 ? "night" : "nights"}
                  </span>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            {booking.specialRequests && (
              <div className="mb-6 border-b border-slate-100 pb-6">
                <h3 className="mb-3 font-semibold text-slate-900">
                  Special Requests
                </h3>
                <p className="text-sm text-slate-700">
                  {booking.specialRequests}
                </p>
              </div>
            )}

            {/* Total Price */}
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-900">
                  Total Amount
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  ฿{booking.totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Booked Date */}
            <div className="mt-4 text-center text-xs text-slate-500">
              Booked on {new Date(booking.createdAt).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Help Text */}
        {!booking && !error && (
          <div className="rounded-xl bg-slate-100 p-6 text-center">
            <svg
              className="mx-auto mb-3 h-12 w-12 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mb-2 font-semibold text-slate-700">
              Need help finding your booking?
            </h3>
            <p className="text-sm text-slate-600">
              Your booking number was sent to your email when you made the
              reservation. It starts with "BK" followed by numbers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
