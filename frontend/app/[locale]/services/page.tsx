import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ChatWidget from "../../components/ChatWidget";
import { backendBaseUrl, frontendBaseUrl, resolveUploadUrl } from "@/lib/urls";
import { Link } from "@/lib/navigation";

type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
};

type ServiceSummary = {
  id: string;
  title: string;
  slug: string;
  price?: string;
  shortDescription?: string;
  coverImage?: string;
  rating?: number;
  reviewCount?: number;
  category?: { id: string; name: string; slug: string } | null;
};

async function fetchCategories(): Promise<ServiceCategory[]> {
  try {
    const response = await fetch(`${backendBaseUrl}/service-categories`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.categories || [];
  } catch {
    return [];
  }
}

async function fetchServices(locale: string): Promise<ServiceSummary[]> {
  try {
    const response = await fetch(
      `${backendBaseUrl}/services?status=published&locale=${locale}`,
      { cache: "no-store" }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.services || [];
  } catch {
    return [];
  }
}

async function fetchMenu(locale: string) {
  try {
    const response = await fetch(`${backendBaseUrl}/menu?locale=${locale}`, {
      cache: "no-store",
    });
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

export const metadata = {
  title: "บริการของเรา | The Wang Yaowarat",
  description: "รวมบริการระบบปรับอากาศ ติดตั้ง ซ่อม ล้าง และบำรุงรักษารายปี",
  alternates: {
    canonical: frontendBaseUrl ? `${frontendBaseUrl}/services` : "/services",
  },
};

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [categories, services, menu, footer] = await Promise.all([
    fetchCategories(),
    fetchServices(locale),
    fetchMenu(locale),
    fetchFooter(),
  ]);

  const categoryCounts = categories.reduce<Record<string, number>>(
    (acc, category) => {
      acc[category.slug] = services.filter(
        (service) => service.category?.slug === category.slug
      ).length;
      return acc;
    },
    {}
  );

  return (
    <div>
      <Navbar items={menu?.items || []} cta={menu?.cta} logoUrl={menu?.logoUrl} />
      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <nav className="text-xs text-slate-400">
            หน้าแรก &gt; บริการของเรา
          </nav>
          <h1 className="mt-4 text-3xl font-semibold text-[var(--brand-navy)]">
            บริการช่างแอร์
          </h1>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/services/${service.slug}`}
                className="rounded-3xl bg-white p-4 shadow-xl shadow-blue-900/10 transition hover:-translate-y-1"
              >
                <div className="h-48 overflow-hidden rounded-2xl bg-slate-100">
                  {service.coverImage ? (
                    <img
                      src={resolveUploadUrl(service.coverImage)}
                      alt={service.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h2 className="text-lg font-semibold text-[var(--brand-navy)]">
                    {service.title}
                  </h2>
                  {service.shortDescription && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                      {service.shortDescription}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                    <span className="font-semibold text-[var(--brand-blue)]">
                      {service.price || "สอบถามราคา"}
                    </span>
                    <span className="text-xs text-amber-500">
                      {"★".repeat(Math.round(service.rating || 0))}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {services.length === 0 && (
              <p className="text-sm text-slate-500">
                ยังไม่มีบริการในหมวดนี้
              </p>
            )}
          </div>

          <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[var(--brand-navy)]">
                หมวดหมู่บริการ
              </h2>
              <span className="text-xs text-slate-400">
                เลือกหมวดหมู่เพื่อดูรายการบริการ
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/services/category/${category.slug}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-[var(--brand-blue)] hover:bg-white"
                >
                  <p className="text-sm font-semibold text-[var(--brand-navy)]">
                    {category.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {categoryCounts[category.slug] || 0} บริการ
                  </p>
                </Link>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-slate-500">
                  ยังไม่มีหมวดหมู่บริการ
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
      {footer && <Footer footer={footer} />}
      <ChatWidget />
    </div>
  );
}
