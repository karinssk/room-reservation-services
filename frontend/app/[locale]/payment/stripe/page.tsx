"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { backendBaseUrl } from "@/lib/urls";

type BookingInfo = {
  bookingNumber: string;
  roomType: { name: string };
  totalPrice: number;
};

const API_URL = backendBaseUrl;

export default function StripePaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;
  const bookingNumber = searchParams.get("bookingNumber");
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!bookingNumber) {
      router.push(`/${locale}/booking`);
      return;
    }
    const load = async () => {
      try {
        const res = await fetch(
          `${API_URL}/bookings/lookup/${bookingNumber}?locale=${locale}`
        );
        const data = await res.json();
        setBooking(data.booking || null);
      } catch (error) {
        console.error("Failed to load booking:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingNumber, locale, router]);

  const handlePay = async () => {
    if (!bookingNumber) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/payments/stripe/create-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingNumber, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to start Stripe payment");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Stripe payment error:", error);
      alert("Failed to start Stripe payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center">
          Loading payment...
        </div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">Pay with Stripe</h1>
        <p className="mt-2 text-sm text-slate-500">
          Booking #{booking.bookingNumber}
        </p>

        <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <div className="text-base font-semibold text-slate-900">
            {booking.roomType?.name || "Room"}
          </div>
          <div className="mt-2">
            Amount: ฿{Number(booking.totalPrice || 0).toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Supports credit/debit cards and PromptPay.
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={submitting}
          className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "Redirecting..." : "Pay with Stripe"}
        </button>
      </div>
    </div>
  );
}
