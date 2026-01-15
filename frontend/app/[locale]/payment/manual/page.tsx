"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { backendBaseUrl, resolveUploadUrl } from "@/lib/urls";

type BankAccount = {
  bankName: string;
  accountName: string;
  accountNumber: string;
};

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

type PaymentSetting = {
  provider: string;
  bankAccounts: BankAccount[];
  promptPayQrImage: string;
  payOnSiteEnabled: boolean;
};

const API_URL = backendBaseUrl;

export default function ManualPaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;
  const bookingNumber = searchParams.get("bookingNumber");
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [setting, setSetting] = useState<PaymentSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paymentSlip, setPaymentSlip] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"bank_transfer" | "pay_on_site">(
    "bank_transfer"
  );
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!bookingNumber) {
      router.push(`/${locale}/rooms`);
      return;
    }
    const load = async () => {
      try {
        const [bookingRes, settingRes] = await Promise.all([
          fetch(`${API_URL}/bookings/lookup/${bookingNumber}?locale=${locale}`),
          fetch(`${API_URL}/payment-setting`),
        ]);
        const bookingData = await bookingRes.json();
        const settingData = await settingRes.json();
        setBooking(bookingData.booking || null);
        setSetting(settingData.setting || null);
      } catch (error) {
        console.error("Failed to load:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingNumber, locale, router]);

  const handleSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/uploads`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.path) {
        setPaymentSlip(data.path);
      }
    } catch (error) {
      console.error("Failed to upload slip:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!bookingNumber) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/payments/manual/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingNumber,
          method: activeTab,
          paymentSlip: paymentSlip || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to submit payment");
        return;
      }
      setSubmitted(true);
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to submit payment");
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Booking Submitted
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Your booking #{booking.bookingNumber} has been submitted.
          </p>
          {activeTab === "bank_transfer" && (
            <p className="mt-2 text-sm text-slate-600">
              Please transfer the payment to the bank account shown and notify
              us. We will confirm your booking once we receive the payment.
            </p>
          )}
          {activeTab === "pay_on_site" && (
            <p className="mt-2 text-sm text-slate-600">
              Please pay at the property upon check-in. Your booking is pending
              until payment is received.
            </p>
          )}
          <button
            onClick={() => router.push(`/${locale}/rooms`)}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to Rooms
          </button>
        </div>
      </div>
    );
  }

  const bankAccounts = setting?.bankAccounts || [];
  const promptPayQrImage = setting?.promptPayQrImage || "";
  const payOnSiteEnabled = setting?.payOnSiteEnabled !== false;
  const hasBankTransferOption = bankAccounts.length > 0 || promptPayQrImage;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <button
            onClick={() => router.back()}
            className="mb-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Payment</h1>
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
              {hasBankTransferOption && (
                <button
                  onClick={() => setActiveTab("bank_transfer")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "bank_transfer"
                      ? "bg-white text-slate-900 shadow"
                      : "text-slate-600 hover:bg-white/70"
                  }`}
                >
                  Bank Transfer
                </button>
              )}
              {payOnSiteEnabled && (
                <button
                  onClick={() => setActiveTab("pay_on_site")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "pay_on_site"
                      ? "bg-white text-slate-900 shadow"
                      : "text-slate-600 hover:bg-white/70"
                  }`}
                >
                  Pay on Site
                </button>
              )}
            </div>

            {activeTab === "bank_transfer" && hasBankTransferOption && (
              <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Bank Transfer
                </h2>
                <p className="mt-2 text-xs text-slate-500">
                  Please transfer the total amount using one of the options below:
                </p>

                {/* PromptPay QR Code */}
                {promptPayQrImage && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-800">
                      PromptPay QR Code
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Scan this QR code with your banking app to pay
                    </p>
                    <div className="mt-3 flex justify-center">
                      <img
                        src={resolveUploadUrl(promptPayQrImage)}
                        alt="PromptPay QR"
                        className="h-48 w-48 rounded-lg border border-slate-200 bg-white object-contain p-2"
                      />
                    </div>
                    <div className="mt-2 text-center text-lg font-bold text-blue-600">
                      ฿{Number(booking.totalPrice || 0).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Bank Accounts */}
                {bankAccounts.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="text-sm font-medium text-slate-700">
                      Or transfer to bank account:
                    </div>
                    {bankAccounts.map((account, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="text-sm font-semibold text-slate-800">
                          {account.bankName}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          Account Name: {account.accountName}
                        </div>
                        <div className="mt-1 text-sm font-mono text-slate-900">
                          {account.accountNumber}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Payment Slip Upload */}
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="text-sm font-semibold text-slate-800">
                    Upload Payment Slip
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Upload your transfer receipt to speed up verification
                  </p>
                  <div className="mt-3 flex items-start gap-4">
                    {paymentSlip && (
                      <div className="relative">
                        <img
                          src={resolveUploadUrl(paymentSlip)}
                          alt="Payment slip"
                          className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setPaymentSlip("")}
                          className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                        >
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 hover:border-blue-400">
                      <svg
                        className="h-6 w-6 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <span className="mt-1 text-xs text-slate-500">
                        {uploading ? "Uploading..." : "Upload Slip"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSlipUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  After transferring, our staff will verify your payment and
                  confirm your booking.
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Confirm Bank Transfer"}
                </button>
              </div>
            )}

            {activeTab === "pay_on_site" && payOnSiteEnabled && (
              <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Pay on Site
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  You can pay the total amount when you arrive at the property.
                </p>
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm text-slate-600">
                    <strong>Amount to pay:</strong>
                  </div>
                  <div className="mt-1 text-2xl font-bold text-blue-600">
                    ฿{Number(booking.totalPrice || 0).toLocaleString()}
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  Your booking will be held until check-in. Please arrive on
                  time and bring a valid ID.
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Confirm Pay on Site"}
                </button>
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
                {new Date(booking.checkInDate).toLocaleDateString()} &rarr;{" "}
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
