"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { backendBaseUrl } from "@/lib/urls";
import DateRangePicker from "../../components/DateRangePicker";
import RoomCard from "../../components/RoomCard";
import Navbar, { type NavItem } from "../../components/Navbar";
import Footer from "../../components/Footer";
import ChatWidget from "../../components/ChatWidget";

const API_URL = backendBaseUrl;

type Room = {
  id: string;
  name: string;
  slug: string;
  coverImage?: string;
  pricePerNight: number;
  pricePerMonth: number;
  maxGuests: number;
  size?: string;
  availableRooms?: number;
  category?: { id: string; name: string; slug: string };
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type MenuData = {
  items: NavItem[];
  cta?: { label: string; href: string };
  logoUrl?: string;
};

export default function RoomsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;

  // Get dates from URL or default to today → tomorrow
  const getInitialCheckIn = () => {
    const urlCheckIn = searchParams.get("checkIn");
    if (urlCheckIn) return new Date(urlCheckIn);
    return new Date();
  };

  const getInitialCheckOut = () => {
    const urlCheckOut = searchParams.get("checkOut");
    if (urlCheckOut) return new Date(urlCheckOut);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const [checkIn, setCheckIn] = useState(getInitialCheckIn());
  const [checkOut, setCheckOut] = useState(getInitialCheckOut());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [footer, setFooter] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [checkIn, checkOut, locale]);

  useEffect(() => {
    const loadLayout = async () => {
      try {
        const [menuRes, footerRes] = await Promise.all([
          fetch(`${API_URL}/menu?locale=${locale}`),
          fetch(`${API_URL}/footer`),
        ]);
        if (menuRes.ok) {
          const menuData = await menuRes.json();
          setMenu(menuData.menu || null);
        }
        if (footerRes.ok) {
          const footerData = await footerRes.json();
          setFooter(footerData.footer || null);
        }
      } catch (error) {
        console.error("Failed to load layout:", error);
      }
    };

    loadLayout();
  }, [locale]);

  const loadData = async () => {
    setLoading(true);
    try {
      const checkInStr = checkIn.toISOString().split("T")[0];
      const checkOutStr = checkOut.toISOString().split("T")[0];

      const [roomsRes, categoriesRes] = await Promise.all([
        fetch(
          `${API_URL}/rooms?locale=${locale}&checkIn=${checkInStr}&checkOut=${checkOutStr}&status=published`
        ),
        fetch(`${API_URL}/room-categories`),
      ]);

      const roomsData = await roomsRes.json();
      const categoriesData = await categoriesRes.json();

      setRooms(roomsData.rooms || []);
      setCategories(categoriesData.categories || []);
    } catch (error) {
      console.error("Failed to load rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = () => {
    const checkInStr = checkIn.toISOString().split("T")[0];
    const checkOutStr = checkOut.toISOString().split("T")[0];
    router.push(
      `/${locale}/rooms?checkIn=${checkInStr}&checkOut=${checkOutStr}`
    );
  };

  const getCategoryName = (name: any) => {
    if (typeof name === "string") return name;
    return name?.[locale] || name?.en || name?.th || "";
  };

  const filteredRooms = rooms.filter((room) => {
    if (selectedCategory === "all") return true;
    return room.category?.slug === selectedCategory;
  });

  return (
    <div>
      <Navbar items={menu?.items || []} cta={menu?.cta} logoUrl={menu?.logoUrl} />
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold text-slate-900">
              Available Rooms
            </h1>
            <p className="text-slate-600">
              Find the perfect room for your stay
            </p>
          </div>

          {/* Date Picker */}
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
            <DateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              onCheckInChange={setCheckIn}
              onCheckOutChange={setCheckOut}
            />
            <button
              onClick={handleDateChange}
              className="mt-4 w-full rounded-xl bg-black px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Update Availability
            </button>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  selectedCategory === "all"
                    ? "bg-black text-white"
                    : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                All Rooms
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.slug)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    selectedCategory === category.slug
                      ? "bg-black text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {getCategoryName(category.name)}
                </button>
              ))}
            </div>
          )}

          {/* Rooms Grid */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="text-slate-500">Loading available rooms...</div>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <svg
                className="mx-auto mb-4 h-16 w-16 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mb-2 text-xl font-bold text-slate-900">
                No rooms available
              </h3>
              <p className="text-slate-600">
                Try selecting different dates or check back later
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  checkIn={checkIn.toISOString().split("T")[0]}
                  checkOut={checkOut.toISOString().split("T")[0]}
                  locale={locale}
                />
              ))}
            </div>
          )}

          {/* Results count */}
          {!loading && filteredRooms.length > 0 && (
            <div className="mt-6 text-center text-sm text-slate-600">
              Showing {filteredRooms.length} available{" "}
              {filteredRooms.length === 1 ? "room" : "rooms"}
            </div>
          )}
        </div>
      </div>
      {footer && <Footer footer={footer} />}
      <ChatWidget />
    </div>
  );
}
