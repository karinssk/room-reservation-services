"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { backendBaseUrl } from "@/lib/urls";
import PriceBreakdown from "../../../components/PriceBreakdown";

const API_URL = backendBaseUrl;

type Room = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  coverImage?: string;
  gallery?: string[];
  pricePerNight: number;
  pricePerMonth: number;
  maxGuests: number;
  size?: string;
  beddingOptions?: Array<{ type: string; description: string }>;
  facilities?: {
    bathroomFeatures?: string[];
    climateControl?: string[];
    entertainment?: string[];
    generalAmenities?: string[];
    internet?: string[];
    kitchenFeatures?: string[];
    roomFeatures?: string[];
  };
};

type PromoCode = {
  code: string;
  name: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
};

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;
  const slug = params.slug as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dates from URL
  const checkIn = searchParams.get("checkIn") || new Date().toISOString().split("T")[0];
  const checkOut = searchParams.get("checkOut") || new Date(Date.now() + 86400000).toISOString().split("T")[0];

  // Form state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState(false);
  const [promoData, setPromoData] = useState<PromoCode | null>(null);
  const [discount, setDiscount] = useState(0);

  // Calculate nights
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
    (1000 * 60 * 60 * 24)
  );

  useEffect(() => {
    loadRoom();
    loadDefaultPromo();
  }, [slug, locale]);

  const loadRoom = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/rooms/${slug}?locale=${locale}`);
      if (!res.ok) {
        router.push(`/${locale}/rooms`);
        return;
      }
      const data = await res.json();
      setRoom(data.room);
    } catch (error) {
      console.error("Failed to load room:", error);
      router.push(`/${locale}/rooms`);
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultPromo = async () => {
    try {
      const res = await fetch(`${API_URL}/default-promo`);
      const data = await res.json();
      if (data.promoCode) {
        setPromoCode(data.promoCode.code);
        setPromoData(data.promoCode);
        setPromoValid(true);
        // Calculate discount
        const basePrice = room ? room.pricePerNight * nights : 0;
        if (data.promoCode.discountType === "percentage") {
          setDiscount((basePrice * data.promoCode.discountValue) / 100);
        } else {
          setDiscount(Math.min(data.promoCode.discountValue, basePrice));
        }
      }
    } catch (error) {
      console.error("Failed to load default promo:", error);
    }
  };

  const handlePromoApply = async () => {
    if (!promoCode.trim() || !room) return;

    try {
      const basePrice = room.pricePerNight * nights;
      const res = await fetch(`${API_URL}/validate-promo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode,
          roomTypeId: room.id,
          nights,
          totalAmount: basePrice,
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setPromoValid(true);
        setPromoData(data.promoCode);
        setDiscount(data.discount || 0);
        alert(`Promo code applied! You saved ฿${data.discount.toLocaleString()}`);
      } else {
        setPromoValid(false);
        setPromoData(null);
        setDiscount(0);
        alert(data.error || "Invalid promo code");
      }
    } catch (error) {
      console.error("Failed to validate promo:", error);
      alert("Failed to validate promo code");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomTypeId: room.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          guestName,
          guestEmail,
          guestPhone,
          numberOfGuests,
          promoCode: promoValid ? promoCode : "",
          specialRequests,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(
          `/${locale}/checkout?bookingNumber=${data.booking.bookingNumber}`
        );
      } else {
        alert(data.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Failed to create booking:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resolveImageUrl = (path: string) => {
    if (!path) return "/placeholder-room.jpg";
    if (path.startsWith("http")) return path;
    return `${API_URL}${path}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">Room not found</p>
      </div>
    );
  }

  const basePrice = room.pricePerNight * nights;
  const totalPrice = basePrice - discount;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/${locale}/booking/${slug}?checkIn=${checkIn}&checkOut=${checkOut}`)}
            className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to room details
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Complete Your Booking</h1>
          <p className="mt-2 text-slate-600">
            You're booking {room.name} from {new Date(checkIn).toLocaleDateString()} to{" "}
            {new Date(checkOut).toLocaleDateString()} ({nights} {nights === 1 ? "night" : "nights"})
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Booking Form */}
          <div className="lg:col-span-2">
            {/* Room Summary */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex gap-4">
                <img
                  src={resolveImageUrl(room.coverImage || "")}
                  alt={room.name}
                  className="h-24 w-32 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900">{room.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{room.shortDescription}</p>
                  <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                    <span>Max {room.maxGuests} guests</span>
                    {room.size && <span>{room.size}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-2xl font-bold text-slate-900">Guest Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+66812345678"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Number of Guests *
                  </label>
                  <select
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    required
                  >
                    {Array.from({ length: room.maxGuests }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "guest" : "guests"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="WELCOME10"
                      className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={handlePromoApply}
                      className="rounded-lg bg-slate-800 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-900"
                    >
                      Apply
                    </button>
                  </div>
                  {promoValid && promoData && (
                    <p className="mt-2 text-sm text-green-600">
                      ✓{" "}
                      {typeof promoData.name === "string"
                        ? promoData.name
                        : (promoData.name as any)[locale] || (promoData.name as any)["en"]}{" "}
                      applied! You saved ฿{discount.toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Late check-in, high floor, etc."
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full rounded-lg bg-blue-600 py-4 text-lg font-bold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-400"
              >
                {submitting ? "Processing..." : "Complete Booking"}
              </button>
            </form>
          </div>

          {/* Right Column - Price Breakdown */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <PriceBreakdown
                roomPrice={basePrice}
                totalPrice={totalPrice}
                nights={nights}
                discount={discount}
                promoCode={promoValid ? promoCode : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
