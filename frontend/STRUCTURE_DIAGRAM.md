# Multi-Language & SEO Structure Diagram

## 🏗️ Directory Structure

```
frontend/
│
├── 📄 i18n.ts                         # i18n configuration (locales, messages)
├── 📄 middleware.ts                    # Handles /th, /en routing
├── 📄 next.config.ts                   # Next.js config with next-intl plugin
│
├── 📁 messages/                        # Translation files
│   ├── 📄 en.json                     # English translations
│   └── 📄 th.json                     # Thai translations
│
├── 📁 app/
│   │
│   ├── 📄 layout.tsx                  # ⚠️ Replace with redirect to /th
│   ├── 📄 globals.css                 # Keep here (don't move)
│   ├── 📄 sitemap.ts                  # ✅ Updated with locale support
│   ├── 📄 robots.ts                   # ✅ Already configured
│   │
│   ├── 📁 [locale]/                   # ⭐ New! All pages go here
│   │   │
│   │   ├── 📄 layout.tsx              # ✅ Locale layout with SEO
│   │   ├── 📄 page.tsx                # 🔜 Move from app/page.tsx
│   │   │
│   │   ├── 📁 services/               # 🔜 Move from app/services/
│   │   │   ├── 📄 page.tsx
│   │   │   └── 📁 [slug]/
│   │   │       └── 📄 page.tsx
│   │   │
│   │   ├── 📁 products/               # 🔜 Move from app/products/
│   │   │   ├── 📄 page.tsx
│   │   │   └── 📁 [slug]/
│   │   │       └── 📄 page.tsx
│   │   │
│   │   ├── 📁 blog/                   # 🔜 Move from app/blog/
│   │   │   ├── 📄 page.tsx
│   │   │   └── 📁 [slug]/
│   │   │       └── 📄 page.tsx
│   │   │
│   │   ├── 📁 [slug]/                 # 🔜 Move from app/[slug]/
│   │   │   └── 📄 page.tsx
│   │   │
│   │   └── 📁 calendar-customize/     # 🔜 Move from app/calendar-customize/
│   │       └── 📄 page.tsx
│   │
│   └── 📁 components/                 # ✅ Keep here (shared components)
│       ├── 📄 LanguageSwitcher.tsx    # ✅ New! Language toggle
│       ├── 📄 NavbarWithI18n.tsx      # ✅ Example with i18n
│       ├── 📄 Navbar.tsx              # Your existing navbar
│       ├── 📄 Footer.tsx
│       └── ... (all other components)
│
├── 📁 lib/                            # Keep as is
└── 📁 public/                         # Keep as is
```

## 🌐 URL Routing Flow

```
User visits: yoursite.com
                │
                ↓
        [middleware.ts]
        Detects language
                │
                ├─→ Thai user → Redirect to /th
                └─→ Other → Redirect to /th (default)


User visits: yoursite.com/services
                │
                ↓
        [middleware.ts]
                │
                └─→ Redirect to /th/services


User visits: yoursite.com/th/services
                │
                ↓
        [app/[locale]/services/page.tsx]
                │
                ├─→ Load Thai messages (messages/th.json)
                ├─→ Generate Thai metadata (SEO)
                └─→ Render page with Thai content


User clicks [EN] button
                │
                ↓
        [LanguageSwitcher.tsx]
                │
                └─→ Navigate to /en/services


User visits: yoursite.com/en/services
                │
                ↓
        [app/[locale]/services/page.tsx]
                │
                ├─→ Load English messages (messages/en.json)
                ├─→ Generate English metadata (SEO)
                └─→ Render page with English content
```

## 🔄 Translation Flow

```
Component needs text
        │
        ↓
    useTranslations('namespace')
        │
        ↓
    Checks current locale (th or en)
        │
        ├─→ th → Load messages/th.json
        └─→ en → Load messages/en.json
        │
        ↓
    t('key') returns translated text
        │
        └─→ Render in component
```

## 🎯 SEO Meta Tags Flow

```
User visits page
        │
        ↓
    generateMetadata() function runs
        │
        ├─→ Detect locale (th or en)
        ├─→ Load translations for metadata
        └─→ Generate meta tags
                │
                ├─→ <title>
                ├─→ <meta name="description">
                ├─→ <meta name="keywords">
                ├─→ <link rel="canonical">
                ├─→ <link rel="alternate" hreflang="th">
                ├─→ <link rel="alternate" hreflang="en">
                ├─→ <link rel="alternate" hreflang="x-default">
                ├─→ <meta property="og:*"> (Open Graph)
                └─→ <meta name="twitter:*"> (Twitter Card)
                │
                ↓
    Search engines crawl page
        │
        ├─→ Google sees hreflang tags
        ├─→ Indexes Thai version for Thai users
        └─→ Indexes English version for English users
```

## 📊 Component Translation Example

```
┌─────────────────────────────────────────────────────────┐
│  Hero Component                                         │
│  ───────────────                                        │
│                                                         │
│  import { useTranslations } from 'next-intl';          │
│                                                         │
│  export default function Hero() {                      │
│    const t = useTranslations('hero');                 │
│                                                         │
│    return (                                            │
│      <div>                                             │
│        <h1>{t('title')}</h1>      ┐                   │
│        <p>{t('subtitle')}</p>     ├─ Translation keys │
│        <button>{t('cta')}</button>┘                   │
│      </div>                                            │
│    );                                                  │
│  }                                                     │
└─────────────────────────────────────────────────────────┘
                    │
                    ↓
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  messages/th.json│    │  messages/en.json│
│  ────────────────│    │  ────────────────│
│  {               │    │  {               │
│    "hero": {     │    │    "hero": {     │
│      "title":    │    │      "title":    │
│        "บริการ   │    │        "Professional"
│         แอร์...", │    │         Air...",│
│      "subtitle": │    │      "subtitle": │
│        "ติดตั้ง  │    │        "Expert   │
│         บำรุง...",│   │         Install...",│
│      "cta":      │    │      "cta":      │
│        "เริ่มต้น"│    │        "Get      │
│    }             │    │         Started" │
│  }               │    │    }             │
│                  │    │  }               │
└──────────────────┘    └──────────────────┘
```

## 🗂️ Migration Steps Visual

```
BEFORE (Current):                    AFTER (Multi-language):
─────────────────                    ──────────────────────

app/                                 app/
├── page.tsx                         ├── layout.tsx (redirect)
├── layout.tsx                       ├── globals.css
├── services/                        ├── sitemap.ts (updated)
├── products/                        ├── robots.ts
├── blog/                            │
└── components/                      ├── [locale]/
                                     │   ├── layout.tsx (new)
                                     │   ├── page.tsx
                                     │   ├── services/
                                     │   ├── products/
                                     │   ├── blog/
                                     │   └── ...
                                     │
                                     └── components/
                                         ├── LanguageSwitcher.tsx
                                         └── ...

    Move these ─────────────────────────→  Here
```

## 🔍 SEO Tags in HTML

```html
<!-- What search engines see in your page source -->
<!DOCTYPE html>
<html lang="th">  <!-- or lang="en" -->
<head>
  <!-- Basic SEO -->
  <title>RCA Aircon Express | บริการล้างแอร์ ดูแลครบ จบไว</title>
  <meta name="description" content="บริการล้างแอร์ ซ่อมแอร์ ติดตั้งแอร์...">
  <meta name="keywords" content="บริการล้างแอร์, ซ่อมแอร์, ติดตั้งแอร์...">

  <!-- Canonical & Alternates (hreflang) -->
  <link rel="canonical" href="https://yoursite.com/th/services" />
  <link rel="alternate" hreflang="th" href="https://yoursite.com/th/services" />
  <link rel="alternate" hreflang="en" href="https://yoursite.com/en/services" />
  <link rel="alternate" hreflang="x-default" href="https://yoursite.com/th/services" />

  <!-- Open Graph (Facebook, LinkedIn) -->
  <meta property="og:title" content="RCA Aircon Express" />
  <meta property="og:description" content="บริการล้างแอร์..." />
  <meta property="og:url" content="https://yoursite.com/th/services" />
  <meta property="og:locale" content="th_TH" />
  <meta property="og:locale:alternate" content="en_US" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="RCA Aircon Express" />
  <meta name="twitter:description" content="บริการล้างแอร์..." />
</head>
<body>
  <!-- Your content -->
</body>
</html>
```

## 🗺️ Sitemap Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <!-- Thai Homepage -->
  <url>
    <loc>https://yoursite.com/th</loc>
    <lastmod>2026-01-07</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="th" href="https://yoursite.com/th"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://yoursite.com/en"/>
  </url>

  <!-- English Homepage -->
  <url>
    <loc>https://yoursite.com/en</loc>
    <lastmod>2026-01-07</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="th" href="https://yoursite.com/th"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://yoursite.com/en"/>
  </url>

  <!-- Repeat for all pages in both languages -->

</urlset>
```

## 🎨 Language Switcher Component

```
┌────────────────────────────────────┐
│  Navbar                           │
│  ─────────────────────────────────│
│                                    │
│  [Logo] [Home] [Services] [TH|EN]│
│                            ↑       │
│                            │       │
│                    LanguageSwitcher│
└────────────────────────────────────┘

When clicked:
[TH] → Navigate to /th/current-page
[EN] → Navigate to /en/current-page

Current language is highlighted:
[TH] ← Active (yellow background)
[EN] ← Inactive (gray background)
```

## 📱 User Journey

```
1. User visits yoursite.com
        ↓
2. Middleware redirects to /th (default)
        ↓
3. Page loads with Thai content
        ↓
4. User clicks [EN] button
        ↓
5. Navigate to /en/same-page
        ↓
6. Page loads with English content
        ↓
7. All links now include /en/ prefix
        ↓
8. User browses site in English
        ↓
9. User clicks [TH] button
        ↓
10. Navigate back to /th/same-page
        ↓
11. Page loads with Thai content
```

---

**Visual Summary:**
- 🟢 Green = New files created
- 🟡 Yellow = Files to be updated
- 🔴 Red = Files to be moved
- ⚪ White = Keep as is

Ready to implement! 🚀
