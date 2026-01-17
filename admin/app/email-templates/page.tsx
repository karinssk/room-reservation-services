"use client";

import { useEffect, useMemo, useState } from "react";
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

type BookingConfirmationEditor = {
  headerTitle: string;
  headerSubtitle: string;
  greetingLine: string;
  introLine: string;
  bookingNumberLabel: string;
  roomDetailsTitle: string;
  roomTypeLabel: string;
  roomNumberLabel: string;
  guestCountLabel: string;
  stayDetailsTitle: string;
  checkInLabel: string;
  checkOutLabel: string;
  lengthOfStayLabel: string;
  priceDetailsTitle: string;
  roomPriceLabel: string;
  discountLabel: string;
  totalLabel: string;
  specialRequestsTitle: string;
  checkInInfoTitle: string;
  checkInInfoLines: string;
  buttonLabel: string;
  closingLine1: string;
  closingLine2: string;
  signatureLine: string;
  footerLine1: string;
  footerLine2: string;
};

type BookingCancellationEditor = {
  headerTitle: string;
  greetingLine: string;
  introLine: string;
  bookingNumberLabel: string;
  roomLabel: string;
  checkInLabel: string;
  checkOutLabel: string;
  cancellationReasonLabel: string;
  closingLine1: string;
  closingLine2: string;
  signatureLine: string;
  footerLine1: string;
  footerLine2: string;
};

type EmailTemplate = {
  type: string;
  subject: string;
  html: string;
  staticInfo: StaticInfo;
  editorData: BookingConfirmationEditor | BookingCancellationEditor | null;
};

const templateOptions = [
  { value: "booking_confirmation", label: "Booking Confirmation" },
  { value: "booking_cancellation", label: "Booking Cancellation" },
  { value: "booking_payment_pending", label: "Payment Pending" },
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
  editorData: null,
};

const defaultConfirmationEditor: BookingConfirmationEditor = {
  headerTitle: "Booking Confirmed!",
  headerSubtitle: "Thank you for choosing {{hotelName}}",
  greetingLine: "Dear {{guestName}},",
  introLine: "We're delighted to confirm your reservation at {{hotelName}}. Your booking details are below:",
  bookingNumberLabel: "Booking Number",
  roomDetailsTitle: "Room Details",
  roomTypeLabel: "Room Type",
  roomNumberLabel: "Room Number",
  guestCountLabel: "Number of Guests",
  stayDetailsTitle: "Stay Details",
  checkInLabel: "Check-in",
  checkOutLabel: "Check-out",
  lengthOfStayLabel: "Length of Stay",
  priceDetailsTitle: "Price Breakdown",
  roomPriceLabel: "Room price",
  discountLabel: "Discount",
  totalLabel: "Total",
  specialRequestsTitle: "Special Requests:",
  checkInInfoTitle: "Check-in Information:",
  checkInInfoLines: "• {{checkInInfo}}\n• {{checkOutInfo}}\n• Please present your booking number upon arrival\n• Early check-in and late check-out may be available upon request",
  buttonLabel: "View Booking Details",
  closingLine1: "If you have any questions or need to modify your reservation, please don't hesitate to contact us.",
  closingLine2: "We look forward to welcoming you!",
  signatureLine: "{{hotelName}} Team",
  footerLine1: "{{hotelAddress}}",
  footerLine2: "{{hotelPhone}} | {{hotelEmail}}",
};

const defaultCancellationEditor: BookingCancellationEditor = {
  headerTitle: "Booking Cancelled",
  greetingLine: "Dear {{guestName}},",
  introLine: "This email confirms that your booking has been cancelled.",
  bookingNumberLabel: "Booking Number",
  roomLabel: "Room",
  checkInLabel: "Check-in",
  checkOutLabel: "Check-out",
  cancellationReasonLabel: "Cancellation Reason",
  closingLine1: "If you did not request this cancellation or have any questions, please contact us immediately.",
  closingLine2: "We hope to serve you in the future.",
  signatureLine: "{{hotelName}} Team",
  footerLine1: "{{hotelAddress}}",
  footerLine2: "{{hotelPhone}} | {{hotelEmail}}",
};

const defaultPendingEditor: BookingConfirmationEditor = {
  headerTitle: "Payment Pending",
  headerSubtitle: "We've received your booking at {{hotelName}}",
  greetingLine: "Dear {{guestName}},",
  introLine: "Please complete payment to confirm your reservation. Your booking details are below:",
  bookingNumberLabel: "Booking Number",
  roomDetailsTitle: "Room Details",
  roomTypeLabel: "Room Type",
  roomNumberLabel: "Room Number",
  guestCountLabel: "Number of Guests",
  stayDetailsTitle: "Stay Details",
  checkInLabel: "Check-in",
  checkOutLabel: "Check-out",
  lengthOfStayLabel: "Length of Stay",
  priceDetailsTitle: "Price Summary",
  roomPriceLabel: "Room price",
  discountLabel: "Discount",
  totalLabel: "Total",
  specialRequestsTitle: "Special Requests:",
  checkInInfoTitle: "Check-in Information:",
  checkInInfoLines: "• {{checkInInfo}}\n• {{checkOutInfo}}\n• Please present your booking number upon arrival\n• Early check-in and late check-out may be available upon request",
  buttonLabel: "View Payment Details",
  closingLine1: "If you already completed payment, please ignore this message or contact us.",
  closingLine2: "We look forward to welcoming you!",
  signatureLine: "{{hotelName}} Team",
  footerLine1: "{{hotelAddress}}",
  footerLine2: "{{hotelPhone}} | {{hotelEmail}}",
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
        const editorData =
          data.template.editorData ||
          (type === "booking_cancellation"
            ? defaultCancellationEditor
            : type === "booking_payment_pending"
              ? defaultPendingEditor
              : defaultConfirmationEditor);
        setTemplate({ ...data.template, editorData });
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

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const formatText = (value: string) =>
    escapeHtml(value).replace(/\n/g, "<br>");

  const buildConfirmationHtml = (editorData: BookingConfirmationEditor) => {
    const infoLines = formatText(editorData.checkInInfoLines || "");
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .booking-number { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .booking-number .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
    .booking-number .number { font-size: 24px; font-weight: bold; color: #2563eb; margin-top: 5px; }
    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; font-weight: 500; }
    .detail-value { color: #111827; font-weight: 600; }
    .price-breakdown { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .price-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-row { border-top: 2px solid #e5e7eb; margin-top: 10px; padding-top: 10px; font-size: 18px; font-weight: bold; }
    .total-row .amount { color: #2563eb; }
    .info-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; color: #6b7280; font-size: 14px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${formatText(editorData.headerTitle)}</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">${formatText(editorData.headerSubtitle)}</p>
  </div>
  <div class="content">
    <p>${formatText(editorData.greetingLine)}</p>
    <p>${formatText(editorData.introLine)}</p>
    <div class="booking-number">
      <div class="label">${formatText(editorData.bookingNumberLabel)}</div>
      <div class="number">{{bookingNumber}}</div>
    </div>
    <h2 style="color: #111827; margin-top: 30px;">${formatText(editorData.roomDetailsTitle)}</h2>
    <div class="detail-row">
      <span class="detail-label">${formatText(editorData.roomTypeLabel)}</span>
      <span class="detail-value">{{roomName}}</span>
    </div>
    {{roomNumberBlock}}
    <div class="detail-row">
      <span class="detail-label">${formatText(editorData.guestCountLabel)}</span>
      <span class="detail-value">{{guestCount}} {{guestLabel}}</span>
    </div>
    <h2 style="color: #111827; margin-top: 30px;">${formatText(editorData.stayDetailsTitle)}</h2>
    <div class="detail-row">
      <span class="detail-label">${formatText(editorData.checkInLabel)}</span>
      <span class="detail-value">{{checkInDate}}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">${formatText(editorData.checkOutLabel)}</span>
      <span class="detail-value">{{checkOutDate}}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">${formatText(editorData.lengthOfStayLabel)}</span>
      <span class="detail-value">{{nights}} {{nightLabel}}</span>
    </div>
    <h2 style="color: #111827; margin-top: 30px;">${formatText(editorData.priceDetailsTitle)}</h2>
    <div class="price-breakdown">
      <div class="price-row">
        <span>${formatText(editorData.roomPriceLabel)} × {{nights}} {{nightLabel}}</span>
        <span>฿{{roomPrice}}</span>
      </div>
      {{discountBlock}}
      <div class="price-row total-row">
        <span>${formatText(editorData.totalLabel)}</span>
        <span class="amount">฿{{totalPrice}}</span>
      </div>
    </div>
    {{specialRequestsBlock}}
    <div class="info-box">
      <strong>${formatText(editorData.checkInInfoTitle)}</strong><br>
      ${infoLines}
    </div>
    <div style="text-align: center;">
      <a href="{{bookingUrl}}" class="button">${formatText(editorData.buttonLabel)}</a>
    </div>
    <p style="margin-top: 30px;">${formatText(editorData.closingLine1)}</p>
    <p style="margin-top: 20px;">${formatText(editorData.closingLine2)}</p>
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      Best regards,<br>
      <strong>${formatText(editorData.signatureLine)}</strong>
    </p>
  </div>
  <div class="footer">
    <p style="margin: 0 0 10px 0;">{{hotelName}}</p>
    <p style="margin: 0; font-size: 12px;">
      ${formatText(editorData.footerLine1)}<br>
      ${formatText(editorData.footerLine2)}
    </p>
  </div>
</body>
</html>`;
  };

  const buildCancellationHtml = (editorData: BookingCancellationEditor) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .booking-number { background: #fee2e2; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .footer { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${formatText(editorData.headerTitle)}</h1>
  </div>
  <div class="content">
    <p>${formatText(editorData.greetingLine)}</p>
    <p>${formatText(editorData.introLine)}</p>
    <div class="booking-number">
      <strong>${formatText(editorData.bookingNumberLabel)}: {{bookingNumber}}</strong>
    </div>
    <p><strong>${formatText(editorData.roomLabel)}:</strong> {{roomName}}<br>
    <strong>${formatText(editorData.checkInLabel)}:</strong> {{checkInDate}}<br>
    <strong>${formatText(editorData.checkOutLabel)}:</strong> {{checkOutDate}}</p>
    {{cancellationReasonBlock}}
    <p>${formatText(editorData.closingLine1)}</p>
    <p>${formatText(editorData.closingLine2)}</p>
    <p>Best regards,<br>${formatText(editorData.signatureLine)}</p>
  </div>
  <div class="footer">
    <p style="margin: 0;">{{hotelName}}</p>
    <p style="margin: 0; font-size: 12px;">
      ${formatText(editorData.footerLine1)}<br>
      ${formatText(editorData.footerLine2)}
    </p>
  </div>
</body>
</html>`;
  };

  const derivedHtml = useMemo(() => {
    if (!template.editorData) return template.html || "";
    if (selectedType === "booking_cancellation") {
      return buildCancellationHtml(
        template.editorData as BookingCancellationEditor
      );
    }
    return buildConfirmationHtml(
      template.editorData as BookingConfirmationEditor
    );
  }, [selectedType, template.editorData, template.html]);

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
            html: derivedHtml,
            staticInfo: template.staticInfo,
            editorData: template.editorData,
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
    <div className="mx-auto max-w-6xl">
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

          {selectedType === "booking_cancellation" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700">Email Content</h2>
              <div className="mt-4 grid gap-4">
                <input
                  value={(template.editorData as BookingCancellationEditor)?.headerTitle || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingCancellationEditor),
                        headerTitle: event.target.value,
                      },
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Header title"
                />
                <input
                  value={(template.editorData as BookingCancellationEditor)?.greetingLine || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingCancellationEditor),
                        greetingLine: event.target.value,
                      },
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Greeting line"
                />
                <textarea
                  value={(template.editorData as BookingCancellationEditor)?.introLine || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingCancellationEditor),
                        introLine: event.target.value,
                      },
                    }))
                  }
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Intro line"
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={(template.editorData as BookingCancellationEditor)?.bookingNumberLabel || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingCancellationEditor),
                          bookingNumberLabel: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Booking number label"
                  />
                  <input
                    value={(template.editorData as BookingCancellationEditor)?.roomLabel || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingCancellationEditor),
                          roomLabel: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Room label"
                  />
                  <input
                    value={(template.editorData as BookingCancellationEditor)?.checkInLabel || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingCancellationEditor),
                          checkInLabel: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Check-in label"
                  />
                  <input
                    value={(template.editorData as BookingCancellationEditor)?.checkOutLabel || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingCancellationEditor),
                          checkOutLabel: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Check-out label"
                  />
                  <input
                    value={(template.editorData as BookingCancellationEditor)?.cancellationReasonLabel || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingCancellationEditor),
                          cancellationReasonLabel: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Cancellation reason label"
                  />
                </div>
                <textarea
                  value={(template.editorData as BookingCancellationEditor)?.closingLine1 || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingCancellationEditor),
                        closingLine1: event.target.value,
                      },
                    }))
                  }
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Closing line 1"
                />
                <textarea
                  value={(template.editorData as BookingCancellationEditor)?.closingLine2 || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingCancellationEditor),
                        closingLine2: event.target.value,
                      },
                    }))
                  }
                  className="min-h-[60px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Closing line 2"
                />
                <input
                  value={(template.editorData as BookingCancellationEditor)?.signatureLine || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingCancellationEditor),
                        signatureLine: event.target.value,
                      },
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Signature line"
                />
                <input
                  value={(template.editorData as BookingCancellationEditor)?.footerLine1 || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingCancellationEditor),
                        footerLine1: event.target.value,
                      },
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Footer line 1"
                />
                <input
                  value={(template.editorData as BookingCancellationEditor)?.footerLine2 || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingCancellationEditor),
                        footerLine2: event.target.value,
                      },
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Footer line 2"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700">Email Content</h2>
              <div className="mt-4 grid gap-4">
                <input
                  value={(template.editorData as BookingConfirmationEditor)?.headerTitle || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingConfirmationEditor),
                        headerTitle: event.target.value,
                      },
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Header title"
                />
                <input
                  value={(template.editorData as BookingConfirmationEditor)?.headerSubtitle || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingConfirmationEditor),
                        headerSubtitle: event.target.value,
                      },
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Header subtitle"
                />
                <input
                  value={(template.editorData as BookingConfirmationEditor)?.greetingLine || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingConfirmationEditor),
                        greetingLine: event.target.value,
                      },
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Greeting line"
                />
                <textarea
                  value={(template.editorData as BookingConfirmationEditor)?.introLine || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingConfirmationEditor),
                        introLine: event.target.value,
                      },
                    }))
                  }
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Intro line"
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={(template.editorData as BookingConfirmationEditor)?.bookingNumberLabel || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingConfirmationEditor),
                          bookingNumberLabel: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Booking number label"
                  />
                  <input
                    value={(template.editorData as BookingConfirmationEditor)?.roomDetailsTitle || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingConfirmationEditor),
                          roomDetailsTitle: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Room details title"
                  />
                  <input
                    value={(template.editorData as BookingConfirmationEditor)?.roomTypeLabel || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingConfirmationEditor),
                          roomTypeLabel: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Room type label"
                  />
                  <input
                    value={(template.editorData as BookingConfirmationEditor)?.roomNumberLabel || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingConfirmationEditor),
                          roomNumberLabel: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Room number label"
                  />
                  <input
                    value={(template.editorData as BookingConfirmationEditor)?.guestCountLabel || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingConfirmationEditor),
                          guestCountLabel: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Guest count label"
                  />
                  <input
                    value={(template.editorData as BookingConfirmationEditor)?.stayDetailsTitle || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingConfirmationEditor),
                          stayDetailsTitle: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Stay details title"
                  />
                  <input
                    value={(template.editorData as BookingConfirmationEditor)?.checkInLabel || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingConfirmationEditor),
                          checkInLabel: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Check-in label"
                  />
                  <input
                    value={(template.editorData as BookingConfirmationEditor)?.checkOutLabel || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingConfirmationEditor),
                          checkOutLabel: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Check-out label"
                  />
                  <input
                    value={(template.editorData as BookingConfirmationEditor)?.lengthOfStayLabel || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingConfirmationEditor),
                          lengthOfStayLabel: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Length of stay label"
                  />
                  <input
                    value={(template.editorData as BookingConfirmationEditor)?.priceDetailsTitle || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingConfirmationEditor),
                          priceDetailsTitle: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Price details title"
                  />
                  <input
                    value={(template.editorData as BookingConfirmationEditor)?.roomPriceLabel || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingConfirmationEditor),
                          roomPriceLabel: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Room price label"
                  />
                  <input
                    value={(template.editorData as BookingConfirmationEditor)?.discountLabel || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingConfirmationEditor),
                          discountLabel: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Discount label"
                  />
                  <input
                    value={(template.editorData as BookingConfirmationEditor)?.totalLabel || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingConfirmationEditor),
                          totalLabel: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Total label"
                  />
                  <input
                    value={(template.editorData as BookingConfirmationEditor)?.specialRequestsTitle || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingConfirmationEditor),
                          specialRequestsTitle: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Special requests label"
                  />
                  <input
                    value={(template.editorData as BookingConfirmationEditor)?.checkInInfoTitle || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingConfirmationEditor),
                          checkInInfoTitle: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Check-in info title"
                  />
                  <input
                    value={(template.editorData as BookingConfirmationEditor)?.buttonLabel || ""}
                    onChange={(event) =>
                      setTemplate((prev) => ({
                        ...prev,
                        editorData: {
                          ...(prev.editorData as BookingConfirmationEditor),
                          buttonLabel: event.target.value,
                        },
                      }))
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Button label"
                  />
                </div>
                <textarea
                  value={(template.editorData as BookingConfirmationEditor)?.checkInInfoLines || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingConfirmationEditor),
                        checkInInfoLines: event.target.value,
                      },
                    }))
                  }
                  className="min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Check-in info lines (one per line)"
                />
                <textarea
                  value={(template.editorData as BookingConfirmationEditor)?.closingLine1 || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingConfirmationEditor),
                        closingLine1: event.target.value,
                      },
                    }))
                  }
                  className="min-h-[80px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Closing line 1"
                />
                <textarea
                  value={(template.editorData as BookingConfirmationEditor)?.closingLine2 || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingConfirmationEditor),
                        closingLine2: event.target.value,
                      },
                    }))
                  }
                  className="min-h-[60px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Closing line 2"
                />
                <input
                  value={(template.editorData as BookingConfirmationEditor)?.signatureLine || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingConfirmationEditor),
                        signatureLine: event.target.value,
                      },
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Signature line"
                />
                <input
                  value={(template.editorData as BookingConfirmationEditor)?.footerLine1 || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingConfirmationEditor),
                        footerLine1: event.target.value,
                      },
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Footer line 1"
                />
                <input
                  value={(template.editorData as BookingConfirmationEditor)?.footerLine2 || ""}
                  onChange={(event) =>
                    setTemplate((prev) => ({
                      ...prev,
                      editorData: {
                        ...(prev.editorData as BookingConfirmationEditor),
                        footerLine2: event.target.value,
                      },
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Footer line 2"
                />
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">Preview</h2>
            <div
              className="mt-4 overflow-auto rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700"
              dangerouslySetInnerHTML={{ __html: derivedHtml }}
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
