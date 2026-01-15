"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { backendBaseUrl } from "@/lib/urls";

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

export default function RoomDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;
  const slug = params.slug as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>("");

  // Dates from URL
  const checkIn = searchParams.get("checkIn") || new Date().toISOString().split("T")[0];
  const checkOut = searchParams.get("checkOut") || new Date(Date.now() + 86400000).toISOString().split("T")[0];

  // Calculate nights
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  useEffect(() => {
    loadRoom();
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

  const handleBookNow = () => {
    router.push(`/${locale}/booking/${slug}?checkIn=${checkIn}&checkOut=${checkOut}`);
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
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-slate-600">Loading room details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!room) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4">
        {/* Back button */}
        <button
          onClick={() => router.push(`/${locale}/rooms`)}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to rooms
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

          {/* Right: Booking Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
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

                {/* Price Display */}
                <div className="mb-6">
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-slate-600">Room price × {nights} night{nights > 1 ? 's' : ''}</span>
                    <span className="font-semibold text-slate-900">
                      ฿{(room.pricePerNight * nights).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-slate-900">Total</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ฿{(room.pricePerNight * nights).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Book Now Button */}
                <button
                  onClick={handleBookNow}
                  className="w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-blue-700"
                >
                  Book Now
                </button>

                <p className="mt-4 text-center text-xs text-slate-500">
                  You won't be charged yet
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
