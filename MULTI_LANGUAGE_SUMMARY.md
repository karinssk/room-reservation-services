# Multi-Language Implementation Summary

This document summarizes the multi-language (Thai/English) implementation across the air-con-services-v2 project.

## Overview

The application supports Thai (th) and English (en) languages using:
- **Backend**: MongoDB Mixed types for flexible multi-language storage
- **Admin**: Language tabs UI for managing content in both languages
- **Frontend**: next-intl for locale routing and automatic language detection

---

## Implemented Features

### 1. **Products** ✅
**Backend Model**: `/backend/models/Product.js`
- Multi-language fields: `name`, `highlights[]`, `inBox[]`, `warranty.device`, `warranty.compressor`, `seo.title`, `seo.description`
- Features object values support multi-language

**Backend Routes**: `/backend/routes/products.js`
- Helper functions: `getLangString()`, `localizeProduct()`
- API returns localized data when `?locale=th|en` is provided
- Admin mode (no locale) returns full multi-language objects

**Admin Editor**: `/admin/app/products/[id]/page.tsx`
- Language tabs for switching between Thai/English
- Multi-language inputs for all translatable fields
- Helper functions: `getLabel()`, `updateMultiLangString()`, `updateMultiLangArray()`

**Frontend**:
- `/frontend/app/[locale]/products/page.tsx` - Product listing with locale parameter
- `/frontend/app/[locale]/products/[slug]/page.tsx` - Product detail with locale parameter

---

### 2. **Services** ✅
**Backend Model**: `/backend/models/Service.js`
- Multi-language fields: `title`, `price`, `shortDescription`, `seo.title`, `seo.description`

**Backend Routes**: `/backend/routes/services.js`
- Helper functions: `getLangString()`, `localizeService()`
- Supports both MongoDB ObjectId and slug lookups in GET `/services/:slug`
- Admin mode returns full multi-language objects

**Admin Editor**: `/admin/app/services/ServiceEditor.tsx`
- Language tabs implementation
- Multi-language inputs for all translatable fields
- Types defined in `/admin/app/services/types.ts`

**Admin List**: `/admin/app/services/page.tsx`
- Edit button correctly uses service ID (fixed from using slug)

**Admin Route**: `/admin/app/services/[slug]/page.tsx`
- Async component that properly awaits params (Next.js 15 compatibility)

**Frontend**:
- `/frontend/app/[locale]/services/page.tsx` - Service listing with locale parameter
- Uses next-intl Link component for locale-aware navigation

---

### 3. **Menu** ✅
**Backend Model**: `/backend/models/Menu.js`
- Multi-language fields: `cta.label`, menu items `label`

**Backend Routes**: `/backend/routes/menu.js`
- Helper functions for localization
- Returns localized menu based on locale parameter

**Admin**: Menu editor with language tabs

---

### 4. **Pages (CMS)** ✅
**Backend Model**: `/backend/models/Page.js`
- Multi-language fields: `title`, `description`, `seo.title`, `seo.description`

**Backend Routes**: Locale-aware API endpoints

**Admin**: Page builder with language tabs

---

### 5. **Footer** ✅ (Single language)
**Decision**: Footer remains single language for all pages
- Contact info doesn't need translation
- Links use next-intl for locale-aware routing automatically
- Simpler to maintain

---

## Technical Implementation

### Backend Pattern

```javascript
// 1. Model Schema (Mixed type for backward compatibility)
const schema = new mongoose.Schema({
    title: { type: mongoose.Schema.Types.Mixed, required: true },
    // Can be: "string" or { th: "string", en: "string" }
});

// 2. Helper Functions
function getLangString(value, locale) {
    if (!value) return "";
    if (typeof value === "string") return value;
    return value[locale] || value.th || value.en || "";
}

function localizeData(data, locale) {
    return {
        ...data,
        title: getLangString(data.title, locale),
        // ... other fields
    };
}

// 3. Route Logic
router.get("/endpoint", async (req, res) => {
    const locale = req.query.locale; // th or en
    const isAdmin = !locale;

    // Fetch data...

    // Return full data for admin, localized for frontend
    return isAdmin ? fullData : localizeData(fullData, locale);
});
```

### Admin Pattern

```typescript
// 1. Type Definition
type MultiLangString = string | { th: string; en: string };
type Language = "th" | "en";

// 2. Component State
const [activeLanguage, setActiveLanguage] = useState<Language>("th");

// 3. Helper Functions
const getLabel = (label: MultiLangString | undefined): string => {
    return getLangString(label, activeLanguage);
};

const updateMultiLangString = (
    current: MultiLangString | undefined,
    newValue: string
): MultiLangString => {
    if (!current || typeof current === "string") {
        return {
            th: activeLanguage === "th" ? newValue : (current as string) || "",
            en: activeLanguage === "en" ? newValue : "",
        };
    }
    return { ...current, [activeLanguage]: newValue };
};

// 4. UI Components
<LanguageTabs
    activeLanguage={activeLanguage}
    onLanguageChange={setActiveLanguage}
/>

<input
    value={getLabel(item.title)}
    onChange={(e) => updateItem({
        title: updateMultiLangString(item.title, e.target.value)
    })}
/>
```

### Frontend Pattern

```typescript
// 1. Async params (Next.js 15)
export default async function Page({
    params,
}: {
    params: Promise<{ locale: string; slug?: string }>;
}) {
    const { locale, slug } = await params;

    // 2. Fetch with locale
    const data = await fetch(
        `${backendBaseUrl}/endpoint?locale=${locale}`
    );

    // 3. Use next-intl Link for navigation
    import { Link } from "@/lib/navigation";
    <Link href="/services/my-service">Click</Link>
    // Automatically routes to /th/services/my-service or /en/services/my-service
}
```

---

## File Locations

### Shared Types
- `/admin/app/products/types.ts` - Product multi-language types
- `/admin/app/services/types.ts` - Service multi-language types
- Both export: `MultiLangString`, `Language`, `getLangString()`

### Language Tabs Component
- `/admin/app/pages/builder/LanguageTabs.tsx`
- Reusable UI component for language switching

### Navigation Configuration
- `/frontend/lib/navigation.ts` - next-intl navigation setup
- Exports locale-aware `Link`, `useRouter`, etc.

---

## Database Structure

Multi-language fields are stored as:

```javascript
// Legacy/single language (backward compatible)
{ title: "ซ่อมแอร์" }

// Multi-language
{
    title: {
        th: "ซ่อมแอร์",
        en: "Air Conditioner Repair"
    }
}
```

---

## API Conventions

### Admin Requests (Full Data)
```
GET /api/products
GET /api/services
→ Returns full multi-language objects
```

### Frontend Requests (Localized)
```
GET /api/products?locale=th
GET /api/services?locale=en
→ Returns localized strings based on locale
```

### Preview Mode
```
GET /api/services/my-slug?preview=1
→ Returns full multi-language data for admin preview
```

---

## Common Patterns

### ObjectId vs Slug Lookup
Services route handles both:
```javascript
const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.slug);
const query = isObjectId
    ? { _id: req.params.slug }
    : { slug: req.params.slug };
```

### Next.js 15 Params
All dynamic route components must:
```typescript
export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    // ...
}
```

---

## Testing Checklist

- [ ] Admin: Switch language tabs and verify inputs update correctly
- [ ] Admin: Save data and verify multi-language object in database
- [ ] Frontend: Visit `/th/products` and verify Thai content
- [ ] Frontend: Visit `/en/products` and verify English content
- [ ] Frontend: Click nav links and verify locale persists
- [ ] API: Test `?locale=th` returns Thai strings
- [ ] API: Test `?locale=en` returns English strings
- [ ] API: Test no locale returns full objects (admin mode)

---

## Migration Notes

**Existing Data**: The implementation is backward compatible
- Old string values will be treated as Thai by default
- Update data through admin UI to add English translations
- No database migration required

**Fallback Strategy**:
1. Check requested language (e.g., `en`)
2. Fall back to Thai (`th`) if not available
3. Fall back to empty string if neither exists

---

## Future Enhancements

- [ ] Add more languages (Chinese, Japanese, etc.)
- [ ] Implement content translation API integration
- [ ] Add language completion indicators in admin
- [ ] Export/import translations as JSON

---

Generated: 2026-01-07
