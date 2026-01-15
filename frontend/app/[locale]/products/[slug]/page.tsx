import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import ChatWidget from "../../../components/ChatWidget";
import BlogContent from "../../../components/BlogContent";
import ServiceGallery from "../../../components/ServiceGallery";
import ExpandableContent from "../../../components/ExpandableContent";
import { backendBaseUrl, frontendBaseUrl, resolveUploadUrl } from "@/lib/urls";

type ProductDetail = {
    id: string;
    name: string;
    slug: string;
    code: string;
    btu: string;
    status: string;
    categoryId: string | null;
    category?: { id: string; name: string; slug: string } | null;
    description: Record<string, any>;
    features: Record<string, string>;
    highlights: string[];
    warranty: { device: string; compressor: string };
    inBox: string[];
    price: { device: number; installation: number; total: number };
    images: string[];
    compareTable?: {
        heading?: string;
        subheading?: string;
        columns?: string[];
        rows?: Array<Array<{ value?: string; href?: string }>>;
    };
    seo?: { title?: string; description?: string; image?: string };
};

async function fetchProduct(slug: string, locale: string): Promise<ProductDetail | null> {
    const response = await fetch(`${backendBaseUrl}/products/${slug}?locale=${locale}`, {
        cache: "no-store",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.product as ProductDetail;
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

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
    const { locale, slug } = await params;
    const product = await fetchProduct(slug, locale);
    if (!product) return {};
    const title = product.seo?.title || product.name;
    const description = product.seo?.description || `ซื้อ ${product.name} ราคาถูก พร้อมติดตั้ง`;
    const fallbackImage = frontendBaseUrl
        ? `${frontendBaseUrl}/og-aircon.jpg`
        : "/og-aircon.jpg";
    const image = resolveUploadUrl(
        product.seo?.image || product.images?.[0] || fallbackImage
    );
    const canonical = frontendBaseUrl
        ? `${frontendBaseUrl}/products/${product.slug}`
        : `/products/${product.slug}`;
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

export default async function ProductDetail({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>;
}) {
    const { locale, slug } = await params;
    const product = await fetchProduct(slug, locale);
    if (!product) return notFound();

    const [menu, footer] = await Promise.all([
        fetchMenu(locale),
        fetchFooter(),
    ]);

    const canonical = frontendBaseUrl
        ? `${frontendBaseUrl}/products/${product.slug}`
        : `/products/${product.slug}`;

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
                name: "สินค้าแอร์",
                item: frontendBaseUrl ? `${frontendBaseUrl}/products` : "/products",
            },
            {
                "@type": "ListItem",
                position: 3,
                name: product.name,
                item: canonical,
            },
        ],
    };

    const images = product.images.map(img => resolveUploadUrl(img));

    return (
        <div>
            <Navbar items={menu?.items || []} cta={menu?.cta} logoUrl={menu?.logoUrl} />
            <article className="bg-[#f8f9fa] py-10 min-h-screen">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
                />
                <div className="mx-auto max-w-7xl px-4 lg:px-6">
                    <nav className="mb-6 text-xs text-slate-400">
                        หน้าแรก &gt; สินค้าแอร์ &gt; {product.name}
                    </nav>

                    <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">

                        {/* Left Column: Gallery & Details */}
                        <div className="space-y-8">
                            {/* Gallery */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm">
                                <ServiceGallery images={images} />
                            </div>

                            {/* Compare Table */}
                            {product.compareTable?.columns?.length ? (
                                <div className="bg-white rounded-3xl p-6 shadow-sm overflow-hidden">
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-[var(--brand-navy)]">
                                            {product.compareTable.heading || "Compare Models"}
                                        </h3>
                                        {product.compareTable.subheading && (
                                            <p className="text-sm text-slate-500 mt-1">
                                                {product.compareTable.subheading}
                                            </p>
                                        )}
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border border-slate-200 border-collapse">
                                            <thead className="bg-[#0b66b2] text-white">
                                                <tr>
                                                    {product.compareTable.columns.map((column, colIndex) => (
                                                        <th
                                                            key={`${column}-${colIndex}`}
                                                            className="px-4 py-3 text-left font-semibold border border-[#0b66b2]"
                                                        >
                                                            {column}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {product.compareTable?.rows?.map((row, rowIndex) => (
                                                    <tr
                                                        key={`row-${rowIndex}`}
                                                        className="odd:bg-white even:bg-slate-50/70"
                                                    >
                                                        {product.compareTable?.columns?.map((_, colIndex) => {
                                                            const cell = row?.[colIndex];
                                                            const value = cell?.value || "";
                                                            const href = cell?.href || "";
                                                            return (
                                                                <td
                                                                    key={`cell-${rowIndex}-${colIndex}`}
                                                                    className="px-4 py-3 border border-slate-200 text-slate-700"
                                                                >
                                                                    {href ? (
                                                                        <a
                                                                            href={href}
                                                                            className="font-semibold text-slate-800 underline underline-offset-2"
                                                                        >
                                                                            {value || "รายละเอียด"}
                                                                        </a>
                                                                    ) : (
                                                                        <span>{value}</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : null}

                            {/* Features Table */}
                            {Object.keys(product.features).length > 0 && (
                                <div className="bg-white rounded-3xl p-6 shadow-sm overflow-hidden">
                                    <h3 className="text-lg font-bold text-[var(--brand-navy)] mb-4">ข้อมูลทางเทคนิค</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <tbody className="divide-y divide-slate-100">
                                                {Object.entries(product.features).map(([key, value]) => (
                                                    <tr key={key} className="group hover:bg-slate-50">
                                                        <td className="py-3 px-4 font-medium text-slate-600 w-1/3 bg-slate-50/50 group-hover:bg-slate-50">{key}</td>
                                                        <td className="py-3 px-4 text-slate-800">{value}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {product.description && (
                                <div className="bg-white rounded-3xl p-6 shadow-sm">
                                    <h3 className="text-lg font-bold text-[var(--brand-navy)] mb-4">รายละเอียดสินค้า</h3>
                                    <div className="prose prose-slate max-w-none text-sm text-slate-600">
                                        <BlogContent content={product.description} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Key Info & CTA (Sticky) */}
                        <div className="space-y-6 lg:sticky lg:top-24">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                {product.category && (
                                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                        {product.category.name}
                                    </div>
                                )}
                                <h1 className="text-2xl font-bold text-[var(--brand-navy)] leading-tight">
                                    {product.name}
                                </h1>
                                <div className="mt-2 flex items-center gap-3 text-sm font-medium">
                                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{product.code}</span>
                                    {product.btu && <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{product.btu} BTU</span>}
                                </div>

                                <div className="my-6 pt-6 border-t border-slate-100">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-sm text-slate-500">ราคาเครื่องเปล่า</span>
                                        <span className="text-base font-semibold text-slate-700">฿{product.price.device.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline mb-3">
                                        <span className="text-sm text-slate-500">ค่าติดตั้ง</span>
                                        <span className="text-base font-semibold text-slate-700">
                                            {product.price.installation > 0 ? `฿${product.price.installation.toLocaleString()}` : 'ฟรี'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end pt-3 border-t border-slate-100">
                                        <span className="text-sm font-medium text-slate-900">ราคาสุทธิ</span>
                                        <span className="text-3xl font-bold text-[#f25c2a]">฿{product.price.total.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[10px] text-right text-slate-400 mt-1">* ราคารวมภาษีมูลค่าเพิ่มแล้ว</p>
                                </div>

                                <div className="space-y-3">
                                    <a
                                        href="https://line.me/ti/p/~@rcaaircon"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full rounded-xl bg-[#06c755] py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-green-500/20 transition hover:bg-[#05b64d] hover:shadow-green-500/30"
                                    >
                                        สั่งซื้อ / สอบถามทาง LINE
                                    </a>
                                    <a
                                        href="tel:0922934488"
                                        className="block w-full rounded-xl bg-white border border-slate-200 py-3.5 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        โทรสอบถาม 092-293-4488
                                    </a>
                                </div>
                            </div>

                            {/* Highlights */}
                            {product.highlights.length > 0 && (
                                <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
                                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-3">จุดเด่นสินค้า</h3>
                                    <ul className="space-y-2">
                                        {product.highlights.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-500 shrink-0">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                                </svg>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Warranty & InBox */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-amber-500">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.243-8.25-3.285z" />
                                        </svg>
                                        การรับประกัน
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="bg-slate-50 p-3 rounded-lg text-center">
                                            <div className="text-xs text-slate-500 mb-1">คอมเพรสเซอร์</div>
                                            <div className="font-bold text-slate-800">{product.warranty.compressor || "-"} ปี</div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg text-center">
                                            <div className="text-xs text-slate-500 mb-1">อะไหล่</div>
                                            <div className="font-bold text-slate-800">{product.warranty.device || "-"} ปี</div>
                                        </div>
                                    </div>
                                </div>

                                {product.inBox.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                            </svg>
                                            อุปกรณ์ในกล่อง
                                        </h3>
                                        <ul className="text-sm text-slate-600 list-disc list-inside space-y-1 pl-1">
                                            {product.inBox.map((item, idx) => (
                                                <li key={idx}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </article>
            {footer && <Footer footer={footer} />}
            <ChatWidget />
        </div>
    );
}
