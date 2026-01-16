import Script from "next/script";
import type { Metadata } from "next";
import ChatWidget from "../components/ChatWidget";
import PopupImage from "../components/PopupImage";
import Footer from "../components/Footer";
import Navbar, { type NavItem } from "../components/Navbar";
import ContactBar from "../components/ContactBar";
import PageRenderer from "../components/PageRenderer";
import { backendBaseUrl, frontendBaseUrl } from "@/lib/urls";

type Block = {
  type: string;
  props: Record<string, any>;
};

type PageData = {
  title: string;
  slug: string;
  seo?: {
    title?: string;
    description?: string;
    image?: string;
  };
  theme?: {
    background?: string;
  };
  layout: Block[];
};

const fallbackPage: PageData = {
  title: "Home",
  slug: "home",
  seo: {
    title: "The Wang Yaowarat",
    description: "บริการล้างแอร์ ซ่อมแอร์ ติดตั้งแอร์ แบบมืออาชีพ",
  },
  theme: { background: "" },
  layout: [],
};

async function fetchPage() {
  try {
    const response = await fetch(`${backendBaseUrl}/pages/home`, {
      cache: "no-store",
    });
    if (!response.ok) return fallbackPage;
    const data = await response.json();
    return data.page as PageData;
  } catch {
    return fallbackPage;
  }
}

async function fetchMenu(locale: string) {
  try {
    const response = await fetch(`${backendBaseUrl}/menu?locale=${locale}`, { cache: "no-store" });
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

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPage();
  const title = page.seo?.title || page.title;
  const description = page.seo?.description || "";
  const fallbackImage = frontendBaseUrl
    ? `${frontendBaseUrl}/og-aircon.jpg`
    : "/og-aircon.jpg";
  const image = page.seo?.image || fallbackImage;
  const canonical = frontendBaseUrl ? `${frontendBaseUrl}/` : "/";
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [image],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = await fetchPage();
  const menu = await fetchMenu(locale);
  const footer = await fetchFooter();
  const faqBlock = page.layout.find((block) => block.type === "faq");
  const faqItems = (faqBlock?.props?.items || []) as Array<{
    question: string;
    answer: string;
  }>;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
  const fallbackImage = frontendBaseUrl
    ? `${frontendBaseUrl}/og-aircon.jpg`
    : "/og-aircon.jpg";
  const businessImage = page.seo?.image || fallbackImage;
  const canonical = frontendBaseUrl ? `${frontendBaseUrl}/` : "/";
  const businessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "The Wang Yaowarat",
    image: businessImage,
    telephone: "092-293-4488",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Sukhumvit Rd",
      addressLocality: "Bangkok",
      addressCountry: "TH",
    },
    areaServed: "Bangkok",
    priceRange: "฿฿",
    url: canonical,
    sameAs: [],
  };
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "The Wang Yaowarat",
    url: canonical,
    logo: businessImage,
    sameAs: [],
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "The Wang Yaowarat",
    url: canonical,
    potentialAction: {
      "@type": "SearchAction",
      target: `${canonical}blog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
 const backendBaseUrl = process.env.BACKEND_URL;
  return (

    <div>
      <ContactBar
        enabled={menu?.contactBar?.enabled}
        backgroundColor={menu?.contactBar?.backgroundColor}
        textColor={menu?.contactBar?.textColor}
        items={menu?.contactBar?.items || []}
      />
      <Navbar
        items={menu?.items || []}
        cta={menu?.cta}
        logoUrl={`${backendBaseUrl}/uploads/logo-the-wang-yaowarat.png`}
      />
      {faqItems.length > 0 && (
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <Script
        id="business-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <PageRenderer page={page} />
      {footer && <Footer footer={footer} />}
      <ChatWidget />
      <PopupImage />
    </div>
  );
}
