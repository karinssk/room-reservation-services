"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { backendBaseUrl } from "@/lib/urls";

const API_URL = backendBaseUrl;

export default function OmiseReturnPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;
  const bookingNumber = searchParams.get("bookingNumber");
  const chargeId = searchParams.get("charge_id");
  const [message, setMessage] = useState("Confirming payment...");

  useEffect(() => {
    const confirm = async () => {
      if (!bookingNumber) {
        router.push(`/${locale}/rooms`);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/payments/omise/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingNumber, chargeId }),
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
        console.error("Omise confirmation error:", error);
        setMessage("Failed to confirm payment.");
      }
    };

    confirm();
  }, [bookingNumber, chargeId, locale, router]);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center">
        {message}
      </div>
    </div>
  );
}
