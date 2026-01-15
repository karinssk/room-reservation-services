"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";

type BookingInfo = {
  bookingNumber: string;
  roomType: { name: string; coverImage?: string };
  totalPrice: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  numberOfGuests: number;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
};

const API_URL = backendBaseUrl;

declare global {
  interface Window {
    Omise?: any;
  }
}

export default function OmisePaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;
  const bookingNumber = searchParams.get("bookingNumber");
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiryMonth, setCardExpiryMonth] = useState("");
  const [cardExpiryYear, setCardExpiryYear] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [qrChargeId, setQrChargeId] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "card" | "promptpay" | "mobile"
  >("card");

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

  const confirmAndRedirect = async () => {
    if (!bookingNumber) return;
    const res = await fetch(`${API_URL}/payments/omise/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingNumber }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Payment not completed");
      return;
    }
    router.push(
      `/${locale}/booking-confirmation?bookingNumber=${bookingNumber}`
    );
  };

  const startOmiseSource = async (sourceType: string) => {
    if (!bookingNumber) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/payments/omise/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingNumber, locale, sourceType }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to start Omise payment");
        return;
      }
      if (data.authorizeUri) {
        window.location.href = data.authorizeUri;
        return;
      }
      await confirmAndRedirect();
    } catch (error) {
      console.error("Omise payment error:", error);
      alert("Failed to start Omise payment");
    } finally {
      setSubmitting(false);
    }
  };

  const startPromptPay = async () => {
    if (!bookingNumber) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/payments/omise/promptpay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to start PromptPay");
        return;
      }
      setQrChargeId(data.chargeId);
      setQrImageUrl(data.qrImageUrl || null);
      setQrStatus(data.status || "pending");
    } catch (error) {
      console.error("PromptPay error:", error);
      alert("Failed to start PromptPay");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!qrChargeId) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/payments/omise/status/${qrChargeId}`);
        const data = await res.json();
        if (!res.ok) {
          setQrStatus(data.error || "pending");
          return;
        }
        const status = data.charge?.status || "pending";
        setQrStatus(status);
        if (data.charge?.paid || status === "successful") {
          clearInterval(timer);
          await confirmAndRedirect();
        }
      } catch (error) {
        console.error("PromptPay status error:", error);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [qrChargeId]);

  const handleCardPay = () => {
    if (!bookingNumber || !window.Omise) return;
    const publicKey = process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY || "";
    if (!publicKey) {
      alert("Omise public key missing");
      return;
    }
    if (
      !cardName.trim() ||
      !cardNumber.trim() ||
      !cardExpiryMonth.trim() ||
      !cardExpiryYear.trim() ||
      !cardCvc.trim()
    ) {
      setFormError("Please fill in all card details.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    window.Omise.setPublicKey(publicKey);
    window.Omise.createToken(
      "card",
      {
        name: cardName,
        number: cardNumber,
        expiration_month: cardExpiryMonth,
        expiration_year: cardExpiryYear,
        security_code: cardCvc,
      },
      async (statusCode: number, response: any) => {
        if (statusCode !== 200) {
          setSubmitting(false);
          alert(response.message || "Card tokenization failed");
          return;
        }
        try {
          const res = await fetch(`${API_URL}/payments/omise/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingNumber,
              locale,
              cardToken: response.id,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            alert(data.error || "Failed to charge card");
            return;
          }
          if (data.authorizeUri) {
            window.location.href = data.authorizeUri;
            return;
          }
          await confirmAndRedirect();
        } catch (error) {
          console.error("Omise card payment error:", error);
          alert("Failed to process card payment");
        } finally {
          setSubmitting(false);
        }
      }
    );
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
      <Script src="https://cdn.omise.co/omise.js" strategy="afterInteractive" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <button
            onClick={() => router.back()}
            className="mb-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Pay with Omise</h1>
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
          </div>

          <div className="mt-6">
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <button
              onClick={() => setActiveTab("card")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === "card"
                  ? "bg-white text-slate-900 shadow"
                  : "text-slate-600 hover:bg-white/70"
              }`}
            >
              Credit / Debit Card
            </button>
            <button
              onClick={() => setActiveTab("promptpay")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === "promptpay"
                  ? "bg-white text-slate-900 shadow"
                  : "text-slate-600 hover:bg-white/70"
              }`}
            >
              PromptPay QR
            </button>
            <button
              onClick={() => setActiveTab("mobile")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === "mobile"
                  ? "bg-white text-slate-900 shadow"
                  : "text-slate-600 hover:bg-white/70"
              }`}
            >
              Mobile Banking
            </button>
          </div>

          {activeTab === "card" && (
            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-800">
                Credit / Debit Card
              </h2>
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={resolveUploadUrl("/uploads/payment-images/visa-images.png")}
                  alt="Visa"
                  className="h-8 w-auto object-contain"
                />
                <img
                  src={resolveUploadUrl("/uploads/payment-images/master-card-images.png")}
                  alt="Mastercard"
                  className="h-8 w-auto object-contain"
                />
              </div>
              <div className="mt-3 grid gap-3">
                {formError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {formError}
                  </div>
                )}
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Name on card"
                  value={cardName}
                  onChange={(event) => setCardName(event.target.value)}
                />
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Card number"
                  value={cardNumber}
                  onChange={(event) => setCardNumber(event.target.value)}
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="MM"
                    value={cardExpiryMonth}
                    onChange={(event) => setCardExpiryMonth(event.target.value)}
                  />
                  <input
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="YYYY"
                    value={cardExpiryYear}
                    onChange={(event) => setCardExpiryYear(event.target.value)}
                  />
                  <input
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="CVC"
                    value={cardCvc}
                    onChange={(event) => setCardCvc(event.target.value)}
                  />
                </div>
                <button
                  onClick={handleCardPay}
                  disabled={submitting}
                  className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? "Processing..." : "Pay with Card"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "promptpay" && (
            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-800">
                PromptPay QR
              </h2>
              <div className="mt-3 grid gap-3">
                <button
                  onClick={startPromptPay}
                  disabled={submitting}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span>Generate QR</span>
                    <img
                      src={resolveUploadUrl("/uploads/payment-images/thaiqr.png")}
                      alt="PromptPay"
                      className="h-6 w-auto object-contain"
                    />
                  </span>
                </button>
              </div>
              {qrImageUrl && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-center">
                  <div className="text-sm font-semibold text-slate-800">
                    Scan to pay
                  </div>
                  <img
                    src={qrImageUrl}
                    alt="PromptPay QR"
                    className="mx-auto mt-3 h-48 w-48 object-contain"
                  />
                  <div className="mt-2 text-xs text-slate-500">
                    Status: {qrStatus || "pending"}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "mobile" && (
            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <h2 className="text-sm font-semibold text-slate-800">
                Mobile Banking
              </h2>
              <div className="mt-3 grid gap-2">
                <button
                  onClick={() => startOmiseSource("mobile_banking_kbank")}
                  disabled={submitting}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span>KBank Mobile Banking</span>
                    <img
                      src={resolveUploadUrl("/uploads/payment-images/kbank-images.png")}
                      alt="KBank"
                      className="h-6 w-auto object-contain"
                    />
                  </span>
                </button>
                <button
                  onClick={() => startOmiseSource("mobile_banking_scb")}
                  disabled={submitting}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span>SCB Mobile Banking</span>
                    <img
                      src={resolveUploadUrl("/uploads/payment-images/sbc-images.png")}
                      alt="SCB"
                      className="h-6 w-auto object-contain"
                    />
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-slate-900">
            Booking Details
          </h2>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Booking Number
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {booking.bookingNumber}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Room
              </div>
              {booking.roomType?.coverImage && (
                <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                  <img
                    src={resolveUploadUrl(booking.roomType.coverImage)}
                    alt={booking.roomType?.name || "Room"}
                  className="h-44 w-full object-cover"
                  />
                </div>
              )}
              <div className="mt-2 font-semibold text-slate-900">
                {booking.roomType?.name || "Room"}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Stay Dates
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {new Date(booking.checkInDate).toLocaleDateString()} →{" "}
                {new Date(booking.checkOutDate).toLocaleDateString()}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {booking.nights} {booking.nights === 1 ? "night" : "nights"}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Guest Information
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {booking.guestName}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {booking.guestEmail}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {booking.guestPhone}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {booking.numberOfGuests}{" "}
                {booking.numberOfGuests === 1 ? "guest" : "guests"}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Total Amount
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-600">
                ฿{Number(booking.totalPrice || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
