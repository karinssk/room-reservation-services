# Multi-Language Admin Page Builder Guide

## Current Situation

Your admin page builder creates pages that are **language-neutral** - they don't have separate content for Thai and English. With the new multi-language frontend, you have **two options**:

## Option 1: Language-Neutral Content (Current - Works Now)

**How it works:**
- Pages are created once in the admin
- The same content appears on both `/th/page-slug` and `/en/page-slug`
- You manually write content that works for both languages (or write in one language)

**Pros:**
- ✅ No changes needed - works immediately
- ✅ Simple to manage
- ✅ Good for pages with mostly images/visual content

**Cons:**
- ❌ Can't have different text for Thai and English users
- ❌ Not ideal for text-heavy pages

**When to use:**
- Landing pages with minimal text
- Visual portfolios
- Image galleries
- Pages where translation isn't critical

---

## Option 2: Language-Specific Content (Recommended for Professional Sites)

Update your backend to store content in multiple languages.

### Step 1: Update Backend Schema

Edit `/backend/models/Page.js`:

```javascript
const mongoose = require("mongoose");

const pageBlockSchema = new mongoose.Schema(
    {
        type: { type: String, required: true },
        props: { type: Object, default: {} },
    },
    { _id: false }
);

const pageSchema = new mongoose.Schema(
    {
        title: {
            th: { type: String, required: true },
            en: { type: String, required: true }
        },
        slug: { type: String, required: true, unique: true, index: true },
        status: { type: String, default: "draft", index: true },
        seo: {
            title: {
                th: { type: String, default: "" },
                en: { type: String, default: "" }
            },
            description: {
                th: { type: String, default: "" },
                en: { type: String, default: "" }
            },
            image: { type: String, default: "" },
        },
        theme: {
            background: { type: String, default: "" },
        },
        layout: {
            th: { type: [pageBlockSchema], default: [] },
            en: { type: [pageBlockSchema], default: [] }
        },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Page", pageSchema);
```

### Step 2: Update Admin UI

Add language tabs to the page builder:

**Create: `/admin/app/pages/builder/LanguageTabs.tsx`**

```tsx
"use client";

import { useState } from "react";

type Language = "th" | "en";

export function LanguageTabs({
  activeLanguage,
  onLanguageChange,
}: {
  activeLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}) {
  return (
    <div className="flex gap-2 border-b border-gray-200 mb-4">
      <button
        onClick={() => onLanguageChange("th")}
        className={`px-4 py-2 font-medium transition-colors ${
          activeLanguage === "th"
            ? "border-b-2 border-blue-500 text-blue-600"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        🇹🇭 ไทย
      </button>
      <button
        onClick={() => onLanguageChange("en")}
        className={`px-4 py-2 font-medium transition-colors ${
          activeLanguage === "en"
            ? "border-b-2 border-blue-500 text-blue-600"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        🇬🇧 English
      </button>
    </div>
  );
}
```

### Step 3: Update Page Builder Component

Update `/admin/app/pages/page.tsx`:

```tsx
"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { defaultProps } from "./builder/config";
import { PageEditorPane } from "./builder/PageEditorPane";
import { PagesSidebar } from "./builder/PagesSidebar";
import { LanguageTabs } from "./builder/LanguageTabs";
import type { Block } from "./builder/types";
import { usePages } from "./builder/usePages";
import { backendBaseUrl } from "@/lib/urls";
import Swal from "sweetalert2";

const API_URL = backendBaseUrl;
type Language = "th" | "en";

const createBlock = (type: string): Block => ({
  uid: crypto.randomUUID(),
  type,
  props: JSON.parse(JSON.stringify(defaultProps[type] || {})),
});

export default function PagesBuilder() {
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<Language>("th");
  const [activeElementLabel, setActiveElementLabel] = useState<string | null>(null);
  const [previewMenuOpen, setPreviewMenuOpen] = useState(true);

  const backendMissing = !API_URL;
  const {
    pages,
    activePage,
    statusMessage,
    selectPage,
    createPage,
    updatePage,
    savePage,
    deletePage,
  } = usePages({ createBlock });

  // Get layout for current language
  const activeLayout = useMemo(() => {
    if (!activePage?.layout) return [];
    // If layout is already language-specific
    if (activePage.layout[activeLanguage]) {
      return activePage.layout[activeLanguage];
    }
    // Otherwise use the layout directly (for backward compatibility)
    return activePage.layout;
  }, [activePage, activeLanguage]);

  const updateBlockProps = (
    index: number,
    patch: Record<string, unknown>
  ) => {
    if (!activePage) return;
    const next = [...activeLayout];
    next[index] = {
      ...next[index],
      props: { ...next[index].props, ...patch },
    };

    // Update the layout for the active language
    updatePage({
      layout: {
        ...activePage.layout,
        [activeLanguage]: next
      }
    });
  };

  const addBlock = (type: string) => {
    if (!activePage) return;
    const newBlock = createBlock(type);
    updatePage({
      layout: {
        ...activePage.layout,
        [activeLanguage]: [...activeLayout, newBlock]
      }
    });
  };

  // ... rest of your component
  // Update all layout operations to use activeLanguage

  return (
    <div>
      {backendMissing && (
        <div className="mx-auto mb-4 max-w-6xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          Backend URL ไม่พร้อมใช้งาน
        </div>
      )}
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[300px_1fr]">
        <PagesSidebar
          pages={pages}
          activePageId={activePage?.id}
          onSelectPage={selectPage}
          onCreatePage={createPage}
        />

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow">
          {!activePage ? (
            <p className="text-sm text-slate-500">
              เลือกหน้าเพื่อแก้ไข หรือสร้างหน้าใหม่
            </p>
          ) : (
            <>
              <LanguageTabs
                activeLanguage={activeLanguage}
                onLanguageChange={setActiveLanguage}
              />

              <PageEditorPane
                page={activePage}
                blocks={activeLayout}
                statusMessage={statusMessage}
                activeBlockIndex={activeBlockIndex}
                // ... rest of props
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
```

### Step 4: Update Backend API

Update `/backend/routes/pages.js` to handle language-specific data:

```javascript
// GET page by slug
router.get("/pages/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { locale = 'th' } = req.query; // Get locale from query params

    const page = await Page.findOne({ slug, status: "published" });
    if (!page) {
      return res.status(404).json({ error: "Page not found" });
    }

    // Return data for the requested locale
    const response = {
      ...page.toObject(),
      title: page.title[locale] || page.title.th,
      layout: page.layout[locale] || page.layout.th || page.layout,
      seo: {
        title: page.seo?.title?.[locale] || page.seo?.title?.th || "",
        description: page.seo?.description?.[locale] || page.seo?.description?.th || "",
        image: page.seo?.image || ""
      }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Step 5: Update Frontend to Request Locale-Specific Data

Update your frontend page component to request the correct language:

```tsx
// In your frontend [locale]/[slug]/page.tsx
const locale = await params.locale;
const response = await fetch(
  `${backendBaseUrl}/pages/${slug}?locale=${locale}`
);
```

---

## Option 3: Hybrid Approach (Best of Both Worlds)

**For text blocks only:**
- Store text in both languages: `{ th: "text", en: "text" }`
- Keep images, layouts, and styles language-neutral

**Example block props:**

```json
{
  "type": "hero",
  "props": {
    "title": {
      "th": "บริการแอร์มืออาชีพ",
      "en": "Professional AC Services"
    },
    "subtitle": {
      "th": "ติดตั้ง ซ่อม บำรุงรักษา",
      "en": "Installation, Repair, Maintenance"
    },
    "image": "/hero-image.jpg", // Same for both
    "backgroundColor": "#f5f5f5" // Same for both
  }
}
```

This way:
- Visual elements stay the same
- Only text changes between languages
- Easier to manage than full duplication

---

## Recommendation

**For your air conditioning services website:**

1. **Start with Option 1** (current setup) - it works now without changes
2. **Gradually move to Option 3** (hybrid) for important text-heavy pages
3. **Eventually implement Option 2** (full multi-language) if needed

**Priority pages for multi-language:**
- Homepage (most important)
- Services pages
- Contact page
- About page

**Can stay language-neutral:**
- Image galleries
- Portfolio
- Visual content pages

---

## Quick Win: Add Language Indicator

Even with Option 1, add a visual indicator showing which language the page is being viewed in:

```tsx
// In your frontend PageRenderer or layout
<div className="text-sm text-gray-500 mb-4">
  Currently viewing in: {locale === 'th' ? '🇹🇭 ไทย' : '🇬🇧 English'}
</div>
```

This helps users understand they're seeing the same content in different language contexts.

---

## Migration Path

If you want to upgrade from Option 1 → Option 2:

1. **Create a migration script** to duplicate existing pages
2. **Add language tabs** to admin UI
3. **Update one page at a time** with translated content
4. **Test thoroughly** before going live

Would you like me to help implement any of these options?
