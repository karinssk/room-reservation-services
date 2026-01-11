"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import Link from "next/link";
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

export default function BookingConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;
  const bookingNumber = searchParams.get("bookingNumber");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingNumber) {
      router.push(`/${locale}/rooms`);
      return;
    }
    loadBooking();
  }, [bookingNumber]);

  const loadBooking = async () => {
    if (!bookingNumber) return;

    try {
      const res = await fetch(`${API_URL}/bookings/lookup/${bookingNumber}`);
      if (!res.ok) {
        router.push(`/${locale}/rooms`);
        return;
      }
      const data = await res.json();
      setBooking(data.booking);
    } catch (error) {
      console.error("Failed to load booking:", error);
      router.push(`/${locale}/rooms`);
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            Loading booking details...
          </div>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        {/* Success Message */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-slate-900">
            Booking Confirmed!
          </h1>
          <p className="text-slate-600">
            Your reservation has been successfully confirmed
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          {/* Booking Number */}
          <div className="mb-6 rounded-xl bg-blue-50 p-4 text-center">
            <div className="text-sm text-blue-600">Booking Number</div>
            <div className="text-2xl font-bold text-blue-900">
              {booking.bookingNumber}
            </div>
            <div className="mt-1 text-xs text-blue-600">
              Please save this number for future reference
            </div>
          </div>

          {/* Guest Information */}
          <div className="mb-6 border-b border-slate-100 pb-6">
            <h2 className="mb-3 font-semibold text-slate-900">
              Guest Information
            </h2>
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
            <h2 className="mb-3 font-semibold text-slate-900">
              Room Information
            </h2>
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
            <h2 className="mb-3 font-semibold text-slate-900">Stay Dates</h2>
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
              <h2 className="mb-3 font-semibold text-slate-900">
                Special Requests
              </h2>
              <p className="text-sm text-slate-700">{booking.specialRequests}</p>
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
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handlePrint}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Print Confirmation
          </button>
          <Link
            href={`/${locale}/rooms`}
            className="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Book Another Room
          </Link>
        </div>

        {/* Info Message */}
        <div className="rounded-xl bg-blue-50 p-4 text-center text-sm text-blue-700">
          A confirmation email has been sent to your email address. If you have
          any questions, please contact us with your booking number.
        </div>
      </div>
    </div>
  );
}
