"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { backendBaseUrl } from "@/lib/urls";

type BookingInfo = {
  bookingNumber: string;
  roomType: { name: string; coverImage?: string };
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalPrice: number;
};

type PaymentSetting = {
  provider: "omise" | "stripe";
};

const API_URL = backendBaseUrl;

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;
  const bookingNumber = searchParams.get("bookingNumber");
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [setting, setSetting] = useState<PaymentSetting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingNumber) {
      router.push(`/${locale}/rooms`);
      return;
    }
    const load = async () => {
      try {
        const [bookingRes, settingRes] = await Promise.all([
          fetch(
            `${API_URL}/bookings/lookup/${bookingNumber}?locale=${locale}`
          ),
          fetch(`${API_URL}/payment-setting`),
        ]);
        if (!bookingRes.ok) {
          router.push(`/${locale}/rooms`);
          return;
        }
        const bookingData = await bookingRes.json();
        const settingData = await settingRes.json();
        setBooking(bookingData.booking || null);
        setSetting(settingData.setting || { provider: "omise" });
      } catch (error) {
        console.error("Failed to load checkout:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [bookingNumber, locale, router]);

  const handleContinue = () => {
    if (!setting || !bookingNumber) return;
    const destination =
      setting.provider === "stripe"
        ? `/${locale}/payment/stripe?bookingNumber=${bookingNumber}`
        : `/${locale}/payment/omise?bookingNumber=${bookingNumber}`;
    router.push(destination);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center">
          Loading checkout...
        </div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
          <p className="mt-2 text-sm text-slate-500">
            Booking #{booking.bookingNumber}
          </p>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-600">Room</div>
            <div className="text-lg font-semibold text-slate-900">
              {booking.roomType?.name || "Room"}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {new Date(booking.checkInDate).toLocaleDateString()} →{" "}
              {new Date(booking.checkOutDate).toLocaleDateString()} (
              {booking.nights} {booking.nights === 1 ? "night" : "nights"})
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
            <span className="text-sm font-semibold text-slate-700">
              Total Amount
            </span>
            <span className="text-2xl font-bold text-blue-600">
              ฿{Number(booking.totalPrice || 0).toLocaleString()}
            </span>
          </div>

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
            Default payment gateway:{" "}
            <strong>{setting?.provider === "stripe" ? "Stripe" : "Omise"}</strong>
          </div>

          <button
            onClick={handleContinue}
            className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Continue to Payment
          </button>
        </div>
      </div>
    </div>
  );
}
