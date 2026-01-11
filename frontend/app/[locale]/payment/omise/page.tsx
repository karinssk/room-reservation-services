"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { backendBaseUrl } from "@/lib/urls";

type BookingInfo = {
  bookingNumber: string;
  roomType: { name: string };
  totalPrice: number;
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

  useEffect(() => {
    if (!bookingNumber) {
      router.push(`/${locale}/rooms`);
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
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
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

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Credit / Debit Card
            </h2>
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

          <div className="rounded-2xl border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-800">
              QR / Mobile Banking
            </h2>
            <div className="mt-3 grid gap-2">
              <button
                onClick={startPromptPay}
                disabled={submitting}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                PromptPay QR
              </button>
              <button
                onClick={() => startOmiseSource("mobile_banking_kbank")}
                disabled={submitting}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                KBank Mobile Banking
              </button>
              <button
                onClick={() => startOmiseSource("mobile_banking_scb")}
                disabled={submitting}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                SCB Mobile Banking
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
        </div>
      </div>
    </div>
  );
}
