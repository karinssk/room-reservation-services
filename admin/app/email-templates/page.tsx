"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl } from "@/lib/urls";
import { getAdminAuthHeaders } from "@/lib/auth";

type StaticInfo = {
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string;
  hotelEmail: string;
  checkInInfo: string;
  checkOutInfo: string;
};

type EmailTemplate = {
  type: string;
  subject: string;
  html: string;
  staticInfo: StaticInfo;
};

const templateOptions = [
  { value: "booking_confirmation", label: "Booking Confirmation" },
  { value: "booking_cancellation", label: "Booking Cancellation" },
];

const placeholderList = [
  "{{hotelName}}",
  "{{hotelAddress}}",
  "{{hotelPhone}}",
  "{{hotelEmail}}",
  "{{checkInInfo}}",
  "{{checkOutInfo}}",
  "{{guestName}}",
  "{{bookingNumber}}",
  "{{roomName}}",
  "{{guestCount}}",
  "{{guestLabel}}",
  "{{checkInDate}}",
  "{{checkOutDate}}",
  "{{nights}}",
  "{{nightLabel}}",
  "{{roomPrice}}",
  "{{discount}}",
  "{{totalPrice}}",
  "{{promoCode}}",
  "{{bookingUrl}}",
  "{{roomNumberBlock}}",
  "{{discountBlock}}",
  "{{specialRequestsBlock}}",
  "{{cancellationReasonBlock}}",
];

const emptyTemplate: EmailTemplate = {
  type: "booking_confirmation",
  subject: "",
  html: "",
  staticInfo: {
    hotelName: "",
    hotelAddress: "",
    hotelPhone: "",
    hotelEmail: "",
    checkInInfo: "",
    checkOutInfo: "",
  },
};

export default function EmailTemplatesPage() {
  const [selectedType, setSelectedType] = useState("booking_confirmation");
  const [template, setTemplate] = useState<EmailTemplate>(emptyTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadTemplate = async (type: string) => {
    if (!backendBaseUrl) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendBaseUrl}/email-templates/${type}`, {
        headers: getAdminAuthHeaders(),
      });
      const data = await response.json();
      if (data.template) {
        setTemplate(data.template);
      }
    } catch (error) {
      console.error("Failed to load email template:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplate(selectedType);
  }, [selectedType]);

  const saveTemplate = async () => {
    if (!backendBaseUrl) return;
    setSaving(true);
    try {
      const response = await fetch(
        `${backendBaseUrl}/email-templates/${selectedType}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAdminAuthHeaders(),
          },
          body: JSON.stringify({
            subject: template.subject,
            html: template.html,
            staticInfo: template.staticInfo,
          }),
        }
      );
      if (response.ok) {
        setMessage("Saved");
        setTimeout(() => setMessage(null), 1500);
      } else {
        setMessage("Save failed");
        setTimeout(() => setMessage(null), 2000);
      }
    } catch (error) {
      console.error("Failed to save email template:", error);
      setMessage("Save failed");
      setTimeout(() => setMessage(null), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Email Templates</h1>
          <p className="text-xs text-slate-500">
            Customize subjects, HTML, and hotel info used in booking emails.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveTemplate}
            disabled={saving || loading}
            className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            type="button"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {message && <span className="text-xs text-emerald-600">{message}</span>}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="text-xs font-semibold uppercase text-slate-500">
              Template Type
            </label>
            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              {templateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="text-xs font-semibold uppercase text-slate-500">
              Subject
            </label>
            <input
              value={template.subject}
              onChange={(event) =>
                setTemplate((prev) => ({ ...prev, subject: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="Booking Confirmation - {{bookingNumber}} - {{hotelName}}"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">Hotel Info</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <input
                value={template.staticInfo?.hotelName || ""}
                onChange={(event) =>
                  setTemplate((prev) => ({
                    ...prev,
                    staticInfo: { ...prev.staticInfo, hotelName: event.target.value },
                  }))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Hotel name"
              />
              <input
                value={template.staticInfo?.hotelPhone || ""}
                onChange={(event) =>
                  setTemplate((prev) => ({
                    ...prev,
                    staticInfo: { ...prev.staticInfo, hotelPhone: event.target.value },
                  }))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Phone"
              />
              <input
                value={template.staticInfo?.hotelEmail || ""}
                onChange={(event) =>
                  setTemplate((prev) => ({
                    ...prev,
                    staticInfo: { ...prev.staticInfo, hotelEmail: event.target.value },
                  }))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Email"
              />
              <input
                value={template.staticInfo?.hotelAddress || ""}
                onChange={(event) =>
                  setTemplate((prev) => ({
                    ...prev,
                    staticInfo: { ...prev.staticInfo, hotelAddress: event.target.value },
                  }))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Address"
              />
              <input
                value={template.staticInfo?.checkInInfo || ""}
                onChange={(event) =>
                  setTemplate((prev) => ({
                    ...prev,
                    staticInfo: { ...prev.staticInfo, checkInInfo: event.target.value },
                  }))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Check-in info"
              />
              <input
                value={template.staticInfo?.checkOutInfo || ""}
                onChange={(event) =>
                  setTemplate((prev) => ({
                    ...prev,
                    staticInfo: { ...prev.staticInfo, checkOutInfo: event.target.value },
                  }))
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Check-out info"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="text-xs font-semibold uppercase text-slate-500">
              HTML Template
            </label>
            <textarea
              value={template.html}
              onChange={(event) =>
                setTemplate((prev) => ({ ...prev, html: event.target.value }))
              }
              className="mt-2 min-h-[420px] w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs outline-none focus:border-blue-500"
              placeholder="Paste HTML template here"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-xs text-slate-600 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Placeholders</h2>
          <p className="mt-2 text-xs text-slate-500">
            Use these variables inside subject or HTML.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {placeholderList.map((item) => (
              <span
                key={item}
                className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
