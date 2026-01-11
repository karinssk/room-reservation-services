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

export default function RoomDetailPage() {
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
  const [selectedImage, setSelectedImage] = useState<string>("");

  // Calculate nights
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  useEffect(() => {
    loadRoom();
    loadDefaultPromo();
  }, [slug, locale]);

  // Set initial selected image when room loads
  useEffect(() => {
    if (room) {
      setSelectedImage(room.coverImage || room.gallery?.[0] || "");
    }
  }, [room]);

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
        await validatePromoCode(data.promoCode.code);
      }
    } catch (error) {
      console.error("Failed to load default promo:", error);
    }
  };

  const validatePromoCode = async (code: string) => {
    if (!code || !room) return;

    try {
      const totalAmount = room.pricePerNight * nights;
      const res = await fetch(`${API_URL}/validate-promo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          roomTypeId: room.id,
          nights,
          totalAmount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPromoValid(true);
        setPromoData(data.promoCode);
        setDiscount(data.discount);
      } else {
        setPromoValid(false);
        setPromoData(null);
        setDiscount(0);
      }
    } catch (error) {
      console.error("Failed to validate promo code:", error);
      setPromoValid(false);
      setDiscount(0);
    }
  };

  const handlePromoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPromoCode(e.target.value.toUpperCase());
  };

  const handlePromoApply = () => {
    validatePromoCode(promoCode);
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

      if (res.ok) {
        const data = await res.json();
        router.push(
          `/${locale}/booking-confirmation?bookingNumber=${data.booking.bookingNumber}`
        );
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking");
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
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            Loading room details...
          </div>
        </div>
      </div>
    );
  }

  if (!room) return null;

  const roomPrice = room.pricePerNight * nights;
  const totalPrice = roomPrice - discount;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 text-blue-600 hover:text-blue-700"
        >
          ← Back to rooms
        </button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Room Details */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-6">
              {/* Main Image */}
              <div className="mb-4 overflow-hidden rounded-2xl">
                <img
                  src={resolveImageUrl(selectedImage || room.coverImage || "")}
                  alt={room.name}
                  className="h-96 w-full object-cover"
                />
              </div>

              {/* Thumbnail Gallery */}
              {room.gallery && room.gallery.length > 0 && (
                <div className="grid grid-cols-4 gap-3 md:grid-cols-6">
                  {/* Cover Image Thumbnail */}
                  {room.coverImage && (
                    <button
                      onClick={() => setSelectedImage(room.coverImage || "")}
                      className={`overflow-hidden rounded-lg border-2 transition-all ${
                        selectedImage === room.coverImage
                          ? "border-blue-600 shadow-lg"
                          : "border-slate-200 hover:border-blue-400"
                      }`}
                    >
                      <img
                        src={resolveImageUrl(room.coverImage)}
                        alt="Cover"
                        className="h-20 w-full object-cover"
                      />
                    </button>
                  )}

                  {/* Gallery Thumbnails */}
                  {room.gallery.map((image, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(image)}
                      className={`overflow-hidden rounded-lg border-2 transition-all ${
                        selectedImage === image
                          ? "border-blue-600 shadow-lg"
                          : "border-slate-200 hover:border-blue-400"
                      }`}
                    >
                      <img
                        src={resolveImageUrl(image)}
                        alt={`Gallery ${idx + 1}`}
                        className="h-20 w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Room Info */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
              <h1 className="mb-2 text-3xl font-bold text-slate-900">
                {room.name}
              </h1>
              <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <span>👥 Max {room.maxGuests} guests</span>
                {room.size && <span>📐 {room.size}</span>}
              </div>
              {room.description && (
                <p className="text-slate-700">{room.description}</p>
              )}
            </div>

            {/* Bedding Options */}
            {room.beddingOptions && room.beddingOptions.length > 0 && (
              <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                  Bedding Options
                </h2>
                <div className="space-y-2">
                  {room.beddingOptions.map((option, idx) => (
                    <div key={idx} className="text-slate-700">
                      • {option.type}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Facilities */}
            {room.facilities && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                  Facilities
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {Object.entries(room.facilities).map(([key, items]) => {
                    if (!items || items.length === 0) return null;
                    const title = key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase());
                    return (
                      <div key={key}>
                        <h3 className="mb-2 font-semibold text-slate-900">
                          {title}
                        </h3>
                        <ul className="space-y-1 text-sm text-slate-600">
                          {items.map((item, idx) => (
                            <li key={idx}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg"
              >
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                  Book This Room
                </h2>

                {/* Dates Display */}
                <div className="mb-6 rounded-xl bg-slate-50 p-4">
                  <div className="mb-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-500">Check-in</div>
                      <div className="font-semibold text-slate-900">
                        {new Date(checkIn).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Check-out</div>
                      <div className="font-semibold text-slate-900">
                        {new Date(checkOut).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {nights} {nights === 1 ? "night" : "nights"}
                  </div>
                </div>

                {/* Guest Name */}
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                    placeholder="+66812345678"
                    required
                  />
                </div>

                {/* Number of Guests */}
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Number of Guests
                  </label>
                  <select
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                  >
                    {Array.from({ length: room.maxGuests }, (_, i) => i + 1).map(
                      (num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "guest" : "guests"}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Promo Code */}
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={handlePromoChange}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                      placeholder="WELCOME10"
                    />
                    <button
                      type="button"
                      onClick={handlePromoApply}
                      className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Apply
                    </button>
                  </div>
                  {promoValid && promoData && (
                    <div className="mt-1 text-xs text-green-600">
                      ✓ {promoData.name} applied
                    </div>
                  )}
                </div>

                {/* Special Requests */}
                <div className="mb-6">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-blue-500"
                    rows={3}
                    placeholder="Late check-in, high floor, etc."
                  />
                </div>

                {/* Price Breakdown */}
                <PriceBreakdown
                  roomPrice={roomPrice}
                  discount={discount}
                  totalPrice={totalPrice}
                  nights={nights}
                  promoCode={promoValid ? promoCode : undefined}
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Complete Booking"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
