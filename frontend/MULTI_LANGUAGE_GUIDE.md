# Multi-Language Implementation Guide (Thai & English)

This guide explains how to use the multi-language (i18n) features implemented in this project using `next-intl`.

## Overview

The project now supports Thai (th) and English (en) languages with automatic routing and translation management.

## Project Structure

```
frontend/
├── i18n.ts                          # i18n configuration
├── middleware.ts                     # Route middleware for locale handling
├── messages/                         # Translation files
│   ├── en.json                      # English translations
│   └── th.json                      # Thai translations
├── app/
│   └── [locale]/                    # Locale-based routing
│       └── layout.tsx               # Layout with i18n provider
└── app/components/
    ├── LanguageSwitcher.tsx         # Language switcher component
    └── NavbarWithI18n.tsx           # Example navbar with translations
```

## How URLs Work

All pages are now prefixed with the locale:

- Thai (default): `https://yoursite.com/th/`
- English: `https://yoursite.com/en/`

Examples:
- Home: `/th/` or `/en/`
- Services: `/th/services` or `/en/services`
- Products: `/th/products/air-conditioner` or `/en/products/air-conditioner`

## Migration Steps

### 1. Move Your Existing Pages

You need to move all your existing pages from `app/` to `app/[locale]/`:

```bash
# Example: Move pages to locale directory
mv app/page.tsx app/[locale]/page.tsx
mv app/services app/[locale]/services
mv app/products app/[locale]/products
mv app/blog app/[locale]/blog
mv app/[slug] app/[locale]/[slug]
# etc...
```

**Important:** Keep these files in `app/` (don't move them):
- `app/layout.tsx` (root layout - will be replaced)
- `app/globals.css`
- `app/components/` (components stay here)

### 2. Update Root Layout

Replace your `app/layout.tsx` with a simple redirect or remove it entirely since we now have `app/[locale]/layout.tsx`.

Create a simple `app/layout.tsx`:

```tsx
import { redirect } from 'next/navigation';

export default function RootLayout() {
  redirect('/th'); // Redirect to default locale
}
```

### 3. Using Translations in Components

#### Server Components

```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('common');

  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('contactUs')}</button>
    </div>
  );
}
```

#### Client Components

```tsx
"use client";

import { useTranslations } from 'next-intl';

export default function MyClientComponent() {
  const t = useTranslations('nav');

  return (
    <nav>
      <a href="/home">{t('home')}</a>
      <a href="/services">{t('services')}</a>
    </nav>
  );
}
```

### 4. Updating Links

All internal links need to include the locale prefix:

#### Using useLocale hook (Client Components)

```tsx
"use client";

import { useLocale } from 'next-intl';
import Link from 'next/link';

export default function MyComponent() {
  const locale = useLocale();

  return (
    <Link href={`/${locale}/services`}>
      Services
    </Link>
  );
}
```

#### Using Link component from next-intl

```tsx
import { Link } from 'next-intl';

export default function MyComponent() {
  return (
    <Link href="/services">Services</Link>
  );
}
```

### 5. Adding the Language Switcher

Add the `LanguageSwitcher` component to your navbar or header:

```tsx
import LanguageSwitcher from '@/app/components/LanguageSwitcher';

export default function Header() {
  return (
    <header>
      <nav>
        {/* Your navigation items */}
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
```

## Adding New Translations

### 1. Add to Translation Files

Edit both `messages/en.json` and `messages/th.json`:

**messages/en.json:**
```json
{
  "mySection": {
    "title": "My Title",
    "description": "My Description"
  }
}
```

**messages/th.json:**
```json
{
  "mySection": {
    "title": "หัวข้อของฉัน",
    "description": "คำอธิบายของฉัน"
  }
}
```

### 2. Use in Components

```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('mySection');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

## Translation Namespaces

Current namespaces in translation files:

- `nav` - Navigation items
- `common` - Common UI elements (buttons, labels)
- `hero` - Hero section text
- `services` - Services section
- `products` - Products section
- `about` - About section
- `contact` - Contact form and info
- `footer` - Footer content
- `chat` - Chat widget

## Dynamic Content from Backend

For content stored in your database (like blog posts, services, products), you have two options:

### Option 1: Store translations in database

Update your MongoDB schemas to support multiple languages:

```javascript
const productSchema = new mongoose.Schema({
  name: {
    en: String,
    th: String
  },
  description: {
    en: String,
    th: String
  },
  // ... other fields
});
```

Then in your component:

```tsx
const locale = useLocale();
const productName = product.name[locale];
```

### Option 2: Use translation files with IDs

Store only IDs in database and translations in JSON files:

```json
{
  "products": {
    "product_123": {
      "name": "Air Conditioner",
      "description": "High efficiency air conditioner"
    }
  }
}
```

## SEO with Multi-Language

Update your metadata generators to support multiple languages:

```tsx
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
  };
}
```

## Testing

1. Start the development server:
```bash
cd frontend
npm run dev
```

2. Test both languages:
- Thai: http://localhost:4020/th
- English: http://localhost:4020/en

3. Verify language switching works correctly

## Common Issues

### Issue: 404 on root path
**Solution:** The middleware redirects `/` to `/th` automatically. Make sure middleware.ts is configured correctly.

### Issue: Links not working
**Solution:** All links must include locale prefix. Use `useLocale()` hook or next-intl's `Link` component.

### Issue: Translations not showing
**Solution:**
1. Check that messages files exist in `messages/` folder
2. Verify the translation key exists in both `en.json` and `th.json`
3. Make sure the namespace matches (e.g., `useTranslations('nav')` requires a `nav` key in JSON)

## Next Steps

1. Move all pages from `app/` to `app/[locale]/`
2. Update all components to use translations instead of hard-coded text
3. Add LanguageSwitcher to your navbar
4. Update database schemas to support multiple languages
5. Test thoroughly in both languages

## Example Component Migration

**Before:**
```tsx
export default function Hero() {
  return (
    <div>
      <h1>Professional Air Conditioning Services</h1>
      <button>Contact Us</button>
    </div>
  );
}
```

**After:**
```tsx
import { useTranslations } from 'next-intl';

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('cta')}</button>
    </div>
  );
}
```

For more information, visit: https://next-intl-docs.vercel.app/
