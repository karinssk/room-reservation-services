import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import ChatWidget from "../../../components/ChatWidget";
import BlogContent from "../../../components/BlogContent";
import ServiceGallery from "../../../components/ServiceGallery";
import ServiceDetailPanel from "../../../components/ServiceDetailPanel";
import ServiceChatButton from "../../../components/ServiceChatButton";
import ExpandableContent from "../../../components/ExpandableContent";
import { backendBaseUrl, frontendBaseUrl, resolveUploadUrl } from "@/lib/urls";

type Service = {
  id: string;
  title: string;
  slug: string;
  status: string;
  category?: { id: string; name: string; slug: string } | null;
  price?: string;
  shortDescription?: string;
  rating?: number;
  reviewCount?: number;
  coverImage?: string;
  gallery?: string[];
  videos?: string[];
  content?: Record<string, any>;
  seo?: { title?: string; description?: string; image?: string };
  publishedAt?: string;
};

type ServiceSummary = {
  id: string;
  title: string;
  slug: string;
  price?: string;
  coverImage?: string;
  rating?: number;
  reviewCount?: number;
};

async function fetchService(slug: string, locale: string): Promise<Service | null> {
  const response = await fetch(`${backendBaseUrl}/services/${slug}?locale=${locale}`, {
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.service as Service;
}

async function fetchOtherServices(currentSlug: string): Promise<ServiceSummary[]> {
  try {
    const response = await fetch(
      `${backendBaseUrl}/services?status=published`,
      { cache: "no-store" }
    );
    if (!response.ok) return [];
    const data = await response.json();
    const services = (data.services || []) as ServiceSummary[];
    return services.filter((service) => service.slug !== currentSlug).slice(0, 6);
  } catch {
    return [];
  }
}

async function fetchMenu() {
  try {
    const response = await fetch(`${backendBaseUrl}/menu`, { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json();
    return data.menu || null;
  } catch {
    return null;
  }
}

async function fetchFooter() {
  try {
    const response = await fetch(`${backendBaseUrl}/footer`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    return data.footer || null;
  } catch {
    return null;
  }
}

const toEmbedUrl = (value: string) => {
  if (!value) return "";
  if (value.includes("youtube.com")) {
    const match = value.match(/[?&]v=([^&]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : value;
  }
  if (value.includes("youtu.be")) {
    const match = value.match(/youtu\.be\/([^?&]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : value;
  }
  if (value.includes("vimeo.com")) {
    const match = value.match(/vimeo\.com\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : value;
  }
  return value;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const service = await fetchService(slug, locale);
  if (!service) return {};
  const title = service.seo?.title || service.title;
  const description = service.seo?.description || service.shortDescription || "";
  const fallbackImage = frontendBaseUrl
    ? `${frontendBaseUrl}/og-aircon.jpg`
    : "/og-aircon.jpg";
  const image = resolveUploadUrl(
    service.seo?.image || service.coverImage || fallbackImage
  );
  const canonical = frontendBaseUrl
    ? `${frontendBaseUrl}/services/${service.slug}`
    : `/services/${service.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [image],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ServiceDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const service = await fetchService(slug, locale);
  if (!service) return notFound();
  const [menu, footer, otherServices] = await Promise.all([
    fetchMenu(),
    fetchFooter(),
    fetchOtherServices(slug),
  ]);
  const imageList = [
    service.coverImage || "",
    ...(service.gallery || []),
  ].filter(Boolean);
  const canonical = frontendBaseUrl
    ? `${frontendBaseUrl}/services/${service.slug}`
    : `/services/${service.slug}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "หน้าแรก",
        item: frontendBaseUrl || "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "บริการ",
        item: frontendBaseUrl ? `${frontendBaseUrl}/services` : "/services",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: service.title,
        item: canonical,
      },
    ],
  };

  return (
    <div>
      <Navbar items={menu?.items || []} cta={menu?.cta} logoUrl={menu?.logoUrl} />
      <article className="bg-white py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-4">
            <nav className="text-xs text-slate-400">
              หน้าแรก &gt; บริการ &gt; {service.title}
            </nav>
            <ServiceGallery images={imageList} />
          </div>
          <aside className="h-fit pt-24">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--brand-navy)]">
                {service.title}
              </h1>
              {service.price && (
                <p className="mt-2 text-xl font-semibold text-[#f25c2a]">
                  {service.price}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="text-amber-500">
                  {"★".repeat(Math.round(service.rating || 0))}
                </span>
                <span className="text-rose-500">
                  ({service.reviewCount || 0} รีวิว)
                </span>
                <span>ใช้บริการแล้ว {service.reviewCount || 0} ครั้ง</span>
              </div>
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-[var(--brand-navy)]">
                  รายละเอียดของบริการ
                </h3>
                <div className="mt-2 h-px w-full bg-[#ff6d3a]" />
                {service.shortDescription && (
                  <p className="mt-3 text-sm text-slate-600">
                    {service.shortDescription}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              <ServiceChatButton
                title={service.title}
                slug={service.slug}
                price={service.price}
                className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-[var(--brand-blue)]"
              />
              <ServiceDetailPanel
                title={service.title}
                slug={service.slug}
                price={service.price}
              />
            </div>
          </aside>
        </div>
        {service.content && (
          <div className="mx-auto mt-12 max-w-6xl px-6">
            <h2 className="text-xl font-semibold text-[var(--brand-navy)]">
              รายละเอียดเพิ่มเติม
            </h2>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <ExpandableContent previewLines={5}>
                <BlogContent content={service.content} />
              </ExpandableContent>
            </div>
          </div>
        )}
        {service.videos && service.videos.length > 0 && (
          <div className="mx-auto mt-10 max-w-6xl px-6">
            <h2 className="text-lg font-semibold text-[var(--brand-navy)]">
              วิดีโอแนะนำบริการ
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {service.videos.map((video, index) => (
                <div
                  key={`${video}-${index}`}
                  className="overflow-hidden rounded-2xl border border-slate-200"
                >
                  <iframe
                    src={toEmbedUrl(video)}
                    className="h-56 w-full"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`video-${index}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        {otherServices.length > 0 && (
          <div className="mx-auto mt-12 max-w-6xl px-6">
            <h2 className="text-xl font-semibold text-[var(--brand-navy)]">
              บริการอื่นๆ
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherServices.map((item) => (
                <a
                  key={item.id}
                  href={`/services/${item.slug}`}
                  className="rounded-3xl bg-white p-4 shadow-xl shadow-blue-900/10 transition hover:-translate-y-1"
                >
                  <div className="h-40 overflow-hidden rounded-2xl bg-slate-100">
                    {item.coverImage ? (
                      <img
                        src={resolveUploadUrl(item.coverImage)}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
                      {item.title}
                    </h3>
                    <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                      <span className="font-semibold text-[var(--brand-blue)]">
                        {item.price || "สอบถามราคา"}
                      </span>
                      <span className="text-xs text-amber-500">
                        {"★".repeat(Math.round(item.rating || 0))}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </article>
      {footer && <Footer footer={footer} />}
      <ChatWidget />
    </div>
  );
}
