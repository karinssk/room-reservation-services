# 🚀 Quick Start: Multi-Language Implementation

## ⚡ 5-Minute Setup

### 1. Move Your Pages (Required)
```bash
cd /home/karin/projects/air-con-services-v2/frontend

# Move main page
mv app/page.tsx app/[locale]/page.tsx

# Move directories
mv app/services app/[locale]/services
mv app/products app/[locale]/products
mv app/blog app/[locale]/blog
mv app/[slug] app/[locale]/[slug]
mv app/calendar-customize app/[locale]/calendar-customize
```

### 2. Update Root Layout
Edit `app/layout.tsx` and replace all content with:

```tsx
import { redirect } from 'next/navigation';

export default function RootLayout() {
  redirect('/th');
}
```

### 3. Add Language Switcher to Navbar
Edit your navbar component and add:

```tsx
import LanguageSwitcher from '@/app/components/LanguageSwitcher';

// Inside your navbar JSX:
<LanguageSwitcher />
```

### 4. Test It
```bash
npm run dev
```

Visit:
- http://localhost:4020/th (Thai version)
- http://localhost:4020/en (English version)

## ✅ That's It! Basic Setup Complete

Your site now supports:
- ✅ Thai and English languages
- ✅ SEO optimization with hreflang
- ✅ Language switching
- ✅ Multi-language sitemap

## 📝 Next Steps

### Add Translations to Your Components

**Step 1:** Open any component file

**Step 2:** Replace hard-coded text with translations:

```tsx
// Before
export default function MyComponent() {
  return <h1>Welcome to our site</h1>;
}

// After
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('common');
  return <h1>{t('welcome')}</h1>;
}
```

**Step 3:** Add translations to JSON files:

`messages/en.json`:
```json
{
  "common": {
    "welcome": "Welcome to our site"
  }
}
```

`messages/th.json`:
```json
{
  "common": {
    "welcome": "ยินดีต้อนรับสู่เว็บไซต์ของเรา"
  }
}
```

## 🎯 Priority Tasks

1. **Move pages** (Required) ⚠️
2. **Update root layout** (Required) ⚠️
3. **Add language switcher** (Recommended) ⭐
4. **Translate components** (As needed) 📝
5. **Test thoroughly** (Important) ✅

## 📚 Full Documentation

- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Overview
- **[MULTI_LANGUAGE_GUIDE.md](MULTI_LANGUAGE_GUIDE.md)** - Complete guide
- **[SEO_MULTI_LANGUAGE_GUIDE.md](SEO_MULTI_LANGUAGE_GUIDE.md)** - SEO guide
- **[STRUCTURE_DIAGRAM.md](STRUCTURE_DIAGRAM.md)** - Visual structure
- **[SEO_EXAMPLE_PAGE.tsx](app/components/SEO_EXAMPLE_PAGE.tsx)** - Code example

## 🆘 Troubleshooting

### Issue: 404 errors after moving pages
**Solution:** Make sure you moved pages to `app/[locale]/` not `app/locale/`

### Issue: Translations not showing
**Solution:**
1. Check translation key exists in both `en.json` and `th.json`
2. Verify namespace matches: `useTranslations('nav')` requires `"nav"` key in JSON

### Issue: Language switcher not working
**Solution:** Make sure you're using the component inside a Client Component or add `"use client"` at the top

### Issue: Root path (/) shows error
**Solution:** Update `app/layout.tsx` to redirect to `/th`

## 💡 Quick Tips

- Translation keys are case-sensitive
- Always test both languages
- Keep translation files organized
- Use descriptive key names
- Add new translations immediately

## 🎉 You're Ready!

Your site now has professional multi-language support with SEO optimization!

**Questions?** Check the full documentation files above.
