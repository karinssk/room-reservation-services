# SEO Multi-Language Implementation Guide

This guide explains how SEO has been optimized for your Thai and English multi-language website.

## 🎯 What Has Been Implemented

### 1. **Hreflang Tags** ✅
Automatically generated alternate language links in HTML `<head>` to tell search engines about language variants.

**Location:** [app/[locale]/layout.tsx](app/[locale]/layout.tsx#L40-L46)

**What it does:**
- Adds `<link rel="alternate" hreflang="th" href="...">`
- Adds `<link rel="alternate" hreflang="en" href="...">`
- Adds `<link rel="alternate" hreflang="x-default" href="...">` (default language)

This prevents duplicate content issues and helps Google show the right language version to users.

### 2. **Localized Metadata** ✅
Dynamic title, description, and keywords based on the user's language.

**Location:** [app/[locale]/layout.tsx](app/[locale]/layout.tsx#L24-L62)

**What it does:**
- Generates unique title and description for each language
- Uses locale-specific keywords
- Sets proper `og:locale` for social media
- Creates proper canonical URLs with locale prefix

**Translation Keys:** [messages/en.json](messages/en.json#L2-L7) and [messages/th.json](messages/th.json#L2-L7)

### 3. **XML Sitemap with Locale Support** ✅
Automatically generates sitemap with all language variants and their alternates.

**Location:** [app/sitemap.ts](app/sitemap.ts)

**What it includes:**
- All pages in both Thai and English
- Proper `alternates.languages` for each URL
- Dynamic content from backend (pages, posts, services)
- Proper priorities and change frequencies

**Example sitemap entry:**
```xml
<url>
  <loc>https://yoursite.com/th/services</loc>
  <lastmod>2026-01-07</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
  <xhtml:link rel="alternate" hreflang="th" href="https://yoursite.com/th/services"/>
  <xhtml:link rel="alternate" hreflang="en" href="https://yoursite.com/en/services"/>
</url>
```

### 4. **Robots.txt** ✅
Properly configured to allow search engines to crawl all content.

**Location:** [app/robots.ts](app/robots.ts)

### 5. **Language-specific Meta Tags** ✅
- `<html lang="th">` or `<html lang="en">`
- Proper OpenGraph locale tags
- Twitter Card metadata

## 🔍 How Search Engines See Your Site

### Google Search Results

**Thai Users in Thailand:**
```
RCA Aircon Express | บริการล้างแอร์ ดูแลครบ จบไว
https://yoursite.com/th › services
บริการล้างแอร์ ซ่อมแอร์ ติดตั้งแอร์ แบบมืออาชีพ...
```

**English Users:**
```
RCA Aircon Express | Professional Air Conditioning Services
https://yoursite.com/en › services
Professional air conditioning cleaning, repair, and installation...
```

### Social Media Sharing

When shared on Facebook/Twitter, the correct language version will show with proper title and description.

## 📋 SEO Best Practices Implemented

### ✅ Technical SEO
- [x] Unique title for each page and language
- [x] Unique meta descriptions
- [x] Proper heading hierarchy (H1, H2, H3)
- [x] Canonical URLs with locale
- [x] Hreflang tags for language variants
- [x] XML sitemap with language alternates
- [x] Robots.txt allowing crawling
- [x] Semantic HTML structure
- [x] Mobile-responsive design (inherited)
- [x] Fast page loads with Next.js 16

### ✅ On-Page SEO
- [x] Localized content in translation files
- [x] Proper URL structure (`/th/services`, `/en/services`)
- [x] Language-specific keywords
- [x] Alt text support for images (to be implemented in components)

### ✅ International SEO
- [x] Hreflang implementation
- [x] Separate URLs for each language
- [x] Language selector for users
- [x] Default language fallback (Thai)

## 🛠️ How to Add SEO for New Pages

### Step 1: Create the Page

Move your page to `app/[locale]/your-page/page.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pages.yourPage' });

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords').split(',').map((k: string) => k.trim()),
    alternates: {
      canonical: `/${locale}/your-page`,
      languages: {
        'th': '/th/your-page',
        'en': '/en/your-page',
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `/${locale}/your-page`,
      type: 'website',
    },
  };
}

export default function YourPage() {
  const t = useTranslations('pages.yourPage');

  return (
    <div>
      <h1>{t('heading')}</h1>
      <p>{t('content')}</p>
    </div>
  );
}
```

### Step 2: Add Translations

**messages/en.json:**
```json
{
  "pages": {
    "yourPage": {
      "title": "Your Page Title - RCA Aircon Express",
      "description": "Description for search engines (150-160 characters)",
      "keywords": "keyword1, keyword2, keyword3",
      "heading": "Your Page Heading",
      "content": "Your page content..."
    }
  }
}
```

**messages/th.json:**
```json
{
  "pages": {
    "yourPage": {
      "title": "ชื่อหน้าของคุณ - RCA Aircon Express",
      "description": "คำอธิบายสำหรับเครื่องมือค้นหา (150-160 ตัวอักษร)",
      "keywords": "คีย์เวิร์ด1, คีย์เวิร์ด2, คีย์เวิร์ด3",
      "heading": "หัวข้อหน้าของคุณ",
      "content": "เนื้อหาหน้าของคุณ..."
    }
  }
}
```

### Step 3: Update Sitemap (Optional)

The sitemap automatically includes all static pages, but if you want to customize priority or change frequency, edit [app/sitemap.ts](app/sitemap.ts).

## 📊 Testing Your SEO

### 1. Test Hreflang Tags

Open your page and view source (Ctrl+U). You should see:

```html
<link rel="alternate" hreflang="th" href="https://yoursite.com/th" />
<link rel="alternate" hreflang="en" href="https://yoursite.com/en" />
<link rel="alternate" hreflang="x-default" href="https://yoursite.com/th" />
```

### 2. Test Metadata

Check that title and description change when switching languages.

### 3. Test Sitemap

Visit: `https://yoursite.com/sitemap.xml`

Verify that:
- All pages appear in both languages
- Alternates are properly configured
- URLs are correct

### 4. Google Search Console

After deployment:
1. Submit sitemap to Google Search Console
2. Check International Targeting settings
3. Monitor indexed pages for both languages

### 5. SEO Tools

Use these tools to validate:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Hreflang Tags Testing Tool](https://www.aleydasolis.com/english/international-seo-tools/hreflang-tags-generator/)
- [Technical SEO Site Audit](https://www.seoptimer.com/)

## 🎯 SEO Checklist for Launch

Before going live, ensure:

- [ ] All pages have unique titles in both languages
- [ ] All pages have unique descriptions (150-160 characters)
- [ ] Proper keywords are set for each language
- [ ] Language switcher is visible on all pages
- [ ] All internal links use proper locale prefix
- [ ] Images have proper alt text
- [ ] Sitemap is accessible at `/sitemap.xml`
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Set up Google Analytics with language tracking
- [ ] Test page speed (aim for < 3 seconds)
- [ ] Verify mobile responsiveness
- [ ] Check for broken links in both languages

## 🌍 URL Structure

Your site uses **subdirectory** structure for languages (recommended by Google):

```
✅ Good:
https://yoursite.com/th/services
https://yoursite.com/en/services

❌ Avoid:
https://th.yoursite.com/services (subdomain)
https://yoursite.com/services?lang=th (parameter)
```

**Why subdirectory is best:**
- Easier to set up and maintain
- Consolidates domain authority
- Better for users and search engines
- Works with next-intl out of the box

## 🔧 Advanced SEO Configuration

### Schema.org Structured Data

Add structured data for better search results:

```tsx
export default function ServicePage() {
  const locale = useLocale();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Air Conditioning Repair",
    "provider": {
      "@type": "LocalBusiness",
      "name": "RCA Aircon Express",
      "inLanguage": locale === 'th' ? 'th-TH' : 'en-US'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {/* Your page content */}
    </>
  );
}
```

### Google Analytics Language Tracking

```typescript
// In your analytics setup
gtag('config', 'GA_MEASUREMENT_ID', {
  'language': locale,
  'page_path': `/${locale}${pathname}`
});
```

### Dynamic OG Images per Language

Generate different Open Graph images for each language:

```tsx
openGraph: {
  images: [
    {
      url: `/og-image-${locale}.png`,
      width: 1200,
      height: 630,
      alt: t('ogImageAlt'),
    },
  ],
}
```

## 📈 Monitoring SEO Performance

### Key Metrics to Track

1. **Organic Traffic by Language**
   - Thai vs English traffic ratio
   - Conversion rates per language

2. **Keyword Rankings**
   - Track Thai keywords separately from English
   - Monitor local search rankings

3. **Indexed Pages**
   - Ensure Google indexes both language versions
   - Check for duplicate content issues

4. **Bounce Rate by Language**
   - High bounce rate might indicate poor translations
   - Adjust content based on user behavior

## 🚨 Common SEO Issues & Solutions

### Issue 1: Google indexing wrong language

**Solution:**
- Verify hreflang tags are correct
- Submit sitemap to Search Console
- Use `x-default` for default language

### Issue 2: Duplicate content warnings

**Solution:**
- Ensure canonical URLs include locale
- Verify hreflang implementation
- Make sure translations are unique, not machine-translated

### Issue 3: Language switcher creates duplicate indexing

**Solution:**
- Use proper locale routing (already implemented)
- Canonical URLs point to correct language version
- Hreflang tags properly configured

## 📚 Additional Resources

- [Google Multi-Regional Guidelines](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
- [Hreflang Best Practices](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Next.js SEO Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [next-intl SEO Guide](https://next-intl-docs.vercel.app/docs/routing/middleware#seo)

## ✅ Summary

Your website now has enterprise-level SEO implementation with:
- ✅ Full hreflang support
- ✅ Localized metadata
- ✅ Multi-language sitemap
- ✅ Proper URL structure
- ✅ Social media optimization
- ✅ Search engine friendly architecture

The next step is to fill in your content with proper translations and launch!
