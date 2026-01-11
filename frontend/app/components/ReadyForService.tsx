import React from "react";
import { resolveUploadUrl } from "@/lib/urls";

type ReadyForServiceProps = {
  backgroundColor?: string;
  heading?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  primaryIcon?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  secondaryIcon?: string;
  primaryCtaBackground?: string;
  primaryCtaTextColor?: string;
  secondaryCtaBackground?: string;
  secondaryCtaTextColor?: string;
  iconColor?: string;
};

const safeText = (value?: string) => (value ? String(value) : "");
const resolveImage = (value?: string) => resolveUploadUrl(safeText(value));

export default function ReadyForService({
  backgroundColor,
  heading,
  description,
  primaryCtaText,
  primaryCtaHref,
  primaryIcon,
  secondaryCtaText,
  secondaryCtaHref,
  secondaryIcon,
  primaryCtaBackground,
  primaryCtaTextColor,
  secondaryCtaBackground,
  secondaryCtaTextColor,
  iconColor,
}: ReadyForServiceProps) {
  const backgroundStyle = safeText(backgroundColor)
    ? { backgroundColor: safeText(backgroundColor) }
    : undefined;

  return (
    <section className="py-12 text-white" style={backgroundStyle}>
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 text-center">
        <h2 className="text-3xl font-semibold">{safeText(heading)}</h2>
        <p className="text-sm text-white/80">{safeText(description)}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={safeText(primaryCtaHref) || "#"}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg"
            style={{
              backgroundColor:
                safeText(primaryCtaBackground) || "var(--brand-yellow)",
              color: safeText(primaryCtaTextColor) || "var(--brand-navy)",
            }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20"
              style={{ color: safeText(iconColor) || "currentColor" }}
            >
              {primaryIcon ? (
                <img
                  src={resolveImage(primaryIcon)}
                  alt=""
                  className="h-4 w-4 object-contain"
                />
              ) : (
                "📄"
              )}
            </span>
            {safeText(primaryCtaText)}
          </a>
          <a
            href={safeText(secondaryCtaHref) || "#"}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold"
            style={{
              backgroundColor: safeText(secondaryCtaBackground) || "transparent",
              color: safeText(secondaryCtaTextColor) || "#ffffff",
            }}
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15"
              style={{ color: safeText(iconColor) || "currentColor" }}
            >
              {secondaryIcon ? (
                <img
                  src={resolveImage(secondaryIcon)}
                  alt=""
                  className="h-4 w-4 object-contain"
                />
              ) : (
                "📞"
              )}
            </span>
            {safeText(secondaryCtaText)}
          </a>
        </div>
      </div>
    </section>
  );
}
