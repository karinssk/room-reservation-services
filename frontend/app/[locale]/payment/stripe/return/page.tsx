"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { backendBaseUrl } from "@/lib/urls";

const API_URL = backendBaseUrl;

export default function StripeReturnPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;
  const sessionId = searchParams.get("session_id");
  const bookingNumber = searchParams.get("bookingNumber");
  const [message, setMessage] = useState("Confirming payment...");

  useEffect(() => {
    const confirm = async () => {
      if (!sessionId || !bookingNumber) {
        router.push(`/${locale}/booking`);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/payments/stripe/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, bookingNumber }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage(data.error || "Payment not completed");
          return;
        }
        router.push(
          `/${locale}/booking-confirmation?bookingNumber=${bookingNumber}`
        );
      } catch (error) {
        console.error("Stripe confirmation error:", error);
        setMessage("Failed to confirm payment.");
      }
    };

    confirm();
  }, [sessionId, bookingNumber, locale, router]);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center">
        {message}
      </div>
    </div>
  );
}
