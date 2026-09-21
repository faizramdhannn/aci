# ACI — CLAUDE CODE MASTER PROMPT

Interactive Affiliate Visual Commerce Platform
Production-oriented prompt • Next.js + MongoDB Atlas + Vercel • tanpa Supabase / Neon

## Cara memakai dokumen ini

Salin bagian **PROMPT UTAMA** di bawah ke Claude Code, dijalankan dari root repository kosong (atau repo baru bernama `aci`). Prompt dibuat sangat preskriptif supaya Claude tidak membuat dashboard generik, tidak over-engineering, dan tidak menghasilkan tampilan yang terasa "AI slop".

---

## PROMPT UTAMA

```
You are the lead product engineer, senior frontend engineer, backend engineer, and product designer for this project.

Build a real, production-quality interactive affiliate visual commerce platform called "Aci".

The product is NOT a conventional ecommerce store. The central idea is:

ONE PHOTO → MANY CLICKABLE PRODUCT HOTSPOTS → AFFILIATE LINKS → TRACKED ANALYTICS

A creator uploads one fashion/lifestyle photo, for example a full-body photo. They can then place clickable product/logo hotspots directly over parts of the photo:

- hijab → affiliate product
- shirt → affiliate product
- pants → affiliate product
- bag → affiliate product
- shoes → affiliate product
- watch → affiliate product
- accessories → affiliate product

The experience should feel like a combination of:
- a curated fashion editorial
- a modern ecommerce storefront
- Pinterest/Instagram visual discovery
- a lightweight Canva-like editor

Do NOT make it look like a generic SaaS dashboard.
Do NOT make it look AI-generated.
The result should feel like a small, opinionated, well-designed fashion startup made by a human designer.

============================================================
0. NON-NEGOTIABLE PRODUCT DIRECTION
============================================================

The image is the hero. The product catalog is secondary. The main experience is discovering products THROUGH the image.

A visitor should immediately understand:
"This person created a look. I can tap the items in the photo and shop them."

Do not turn the homepage into a boring grid of product cards. Use large editorial imagery, whitespace, asymmetry, carefully chosen typography, restrained UI, and small details. The design must have personality.

Avoid:
- excessive gradients
- excessive rounded cards
- generic SaaS dashboard patterns
- giant centered headings
- excessive glassmorphism
- neon colors
- purple/blue AI-looking gradients
- excessive shadows
- excessive icons
- "AI" visual clichés
- unnecessary badges
- overly symmetrical layouts
- every section looking like a card

The interface should look designed, not generated.

============================================================
1. REFERENCE VISUAL LANGUAGE
============================================================

Use the uploaded reference image (retro warm color-palette moodboard) as visual inspiration.

The visual palette is:

Cream: #FDF9E3
Yellow: #FBBA00
Orange: #E5781E
Brown: #5A3D2B

Use these as the foundation. Cream should be the dominant background. Brown should be the primary text/dark UI color. Yellow and orange should be used sparingly for accents, CTAs, active states, highlights, and selected elements.

Do not use pure black everywhere. Avoid making every component orange.

The visual feeling:
- warm
- editorial
- handmade
- playful
- fashion-oriented
- slightly retro
- premium but approachable

Typography: use a tasteful modern sans-serif for functional UI, and an expressive display/script font (similar to the reference "Limosin" script) only where it improves brand identity — e.g. logo, section titles. Do not use a decorative font everywhere. Typography should have hierarchy and rhythm. Do not use huge text simply to fill space.

============================================================
2. "ANTI AI SLOP" DESIGN RULES
============================================================

This is extremely important. The application must NOT look like it was generated from a generic AI UI prompt.

Before writing UI code, think like a human product designer.

Rules:
1. Do not make every section a rounded rectangle.
2. Do not use the same card component for everything.
3. Do not use identical spacing between every element if editorial composition benefits from variation.
4. Do not center-align everything.
5. Do not use giant hero text with generic copy such as "Discover. Shop. Inspire."
6. Do not invent meaningless marketing statistics.
7. Do not add fake testimonials.
8. Do not add fake reviews.
9. Do not add fake "10,000+ creators" claims.
10. Do not add unnecessary feature sections just to make the page longer.
11. Do not add gradients unless they have a clear visual purpose.
12. Do not make every button pill-shaped.
13. Do not use excessive glass blur.
14. Do not make every icon inside a circle.
15. Do not use a generic admin template.
16. Do not use generic placeholder copy in the final UI.
17. Do not use "Lorem ipsum".
18. Do not use random emojis as product UI.
19. Do not over-animate.
20. Do not make everything bounce, float, glow, or slide.
21. Do not use purple/blue "AI SaaS" aesthetics.
22. Do not add charts that don't answer a real product question.
23. Do not create ten navigation items when five are enough.
24. Do not make desktop UI simply stack vertically on mobile.
25. Do not use arbitrary absolute positioning for responsive layout.

When unsure, choose the simpler and more intentional design.

============================================================
3. TECHNOLOGY
============================================================

Use:
- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui only where it genuinely helps
- Radix primitives when needed
- Lucide React
- MongoDB Atlas
- MongoDB Node.js driver or Mongoose; choose ONE, do not use both
- React Konva
- Konva
- use-image
- Zod
- React Hook Form
- date-fns
- Recharts only where analytics charts genuinely need it

Deployment: Vercel
Repository: GitHub

IMPORTANT: Do NOT use:
- Supabase
- Neon
- Prisma
- Drizzle
- Firebase

Do not introduce another database platform unless explicitly instructed. Database: MongoDB Atlas.

Storage: Use Vercel Blob for application-managed uploaded assets if available in the project/account. If the repository already contains another configured object-storage provider, inspect it first and reuse it rather than introducing another storage system.

Do not store binary images directly inside MongoDB documents.

============================================================
4. ARCHITECTURE
============================================================

Use Next.js App Router. Prefer Server Components. Use Client Components only for:
- editor
- canvas
- interactive hotspots
- analytics filters
- mobile interactions
- dialogs/sheets
- local UI state

Keep business logic out of presentation components. Use a feature-oriented structure.

Suggested structure:

src/
  app/
    (storefront)/
    admin/
    api/
    go/
  components/
    ui/
    storefront/
    editor/
    analytics/
    navigation/
  features/
    shoppable-images/
    hotspots/
    affiliate/
    analytics/
    categories/
    products/
  lib/
    mongodb/
    storage/
    analytics/
    validation/
    auth/
    utils/
  types/
  hooks/
  config/

Do not create huge files. Prefer small, cohesive modules.

============================================================
5. DATABASE
============================================================

Use MongoDB Atlas. Design collections around the product domain.

Suggested collections:
users, storefronts, categories, collections, shoppableImages, hotspots, affiliateLinks, clickEvents, viewEvents, favorites

Possible document shape:

shoppableImages:
{
  _id, ownerId, title, slug, description,
  imageUrl, imageWidth, imageHeight,
  categoryIds, collectionId, status,
  createdAt, updatedAt
}

hotspots:
{
  _id, shoppableImageId, ownerId,
  type: "product",
  title, description, affiliateUrl, logoUrl, productImageUrl,
  productPrice, marketplace,
  x, y, width, height, rotation, zIndex, style, isActive,
  createdAt, updatedAt
}

IMPORTANT: Coordinates MUST be normalized relative to the source image.

Example:
x: 0.73
y: 0.31
width: 0.08
height: 0.08

Never make the saved data dependent on the editor viewport size. This is critical.

============================================================
6. NORMALIZED COORDINATE SYSTEM
============================================================

Create utility functions:
normalizedToPixels()
pixelsToNormalized()

The editor can work in pixels internally. The database stores normalized values.

Example:
source image: 1200 x 1800
hotspot: x = 0.72, y = 0.35
displayed at: 390 x 585 → resolves to x = 280.8, y = 204.75

This allows the same content to work on desktop, tablet, mobile, and different image sizes. Do not hardcode responsive hotspot positions.

============================================================
7. AUTHENTICATION
============================================================

Do not use Supabase Auth. Implement authentication using a simple architecture appropriate for Next.js and MongoDB.

Preferred: Auth.js / NextAuth with MongoDB adapter if compatible with the chosen Next.js version. If the current repository already has an authentication system, inspect and reuse it.

Support:
- email/password or magic-link style authentication as appropriate
- protected /admin routes
- session validation
- user ownership checks

Never trust client-provided ownerId. Every admin database mutation must verify the authenticated user.

============================================================
8. IMAGE STORAGE
============================================================

Uploaded images should live in object storage, not MongoDB. Use Vercel Blob if available.

Create a clean storage abstraction:
uploadImage()
deleteImage()
getImageUrl()

Do not scatter storage implementation throughout the app.

Validate: MIME type, file extension, file size, dimensions where possible. Use sensible upload limits. Do not allow arbitrary executable files.

============================================================
9. PUBLIC STOREFRONT
============================================================

Create a public visual commerce storefront.

Routes:
/
/shop
/category/[slug]
/collection/[slug]
/p/[slug]
/go/[hotspotId]

The homepage should feel editorial. Suggested structure:
- subtle top navigation
- visual hero or featured shoppable image
- curated sections
- categories
- selected looks
- recent visual posts
- footer

Do not fill the entire page with cards. Use editorial layouts, e.g. one large feature image, two smaller supporting images, asymmetric composition, generous whitespace. The layout should have visual rhythm.

============================================================
10. DESKTOP NAVIGATION
============================================================

Desktop: Use a top navigation bar. It can have a subtle liquid-glass treatment.

Suggested:
LEFT: Aci logo
CENTER: Home, Shop, Categories, Collections
RIGHT: Search, Favorites, Profile

Keep navigation compact. Do not add unnecessary items. Use a translucent cream/brown treatment rather than the common blue/white SaaS navbar.

============================================================
11. MOBILE NAVIGATION
============================================================

On mobile: Do NOT simply shrink the desktop navbar. Use a fixed bottom navigation.

Items: Home, Explore, Categories, Favorites, Profile

Use icon + small label + active state. Support safe-area insets. The bottom bar should feel like an iOS-style floating navigation surface. It should not cover page content.

============================================================
12. LIQUID GLASS
============================================================

Use liquid glass selectively.

Good places:
- desktop navigation
- mobile bottom navigation
- floating image controls
- hotspot popovers
- filter controls
- compact dialogs
- floating editor toolbar

Use: backdrop-filter blur, translucent backgrounds, subtle borders, soft highlights, restrained shadows.

Do not make product cards, entire page sections, every button, or every panel into glass. The glass should be an accent — like glass over warm cream, not like Apple's website copied literally.

============================================================
13. SHOPPABLE IMAGE VIEWER
============================================================

This is the most important public component.

Create: <ShoppableImage />

It renders: image, hotspots, interaction layer. Hotspots should remain correctly positioned relative to the image.

Desktop: hover can reveal a small product preview; click opens product information.
Mobile: tap opens a bottom sheet or compact product panel.

The product panel should show: logo, product name, optional price, marketplace, "Shop product" CTA.

Clicking "Shop product" must track the event before redirecting. Do not force visitors to create an account.

============================================================
14. HOTSPOT VISUAL DESIGN
============================================================

Default hotspot: small logo/badge. It should be noticeable but not destroy the photo.

Possible visual states: idle, hover, selected, loading.

Use subtle scale/opacity transitions. Avoid constant pulsing animations.

Allow admin customization: logo, size, border, shadow, label, animation, rotation.

============================================================
15. ADMIN DASHBOARD
============================================================

Route: /admin

Admin should feel like a custom studio, not a generic enterprise dashboard.

Navigation: Overview, Shoppable Images, Products, Categories, Analytics, Settings

Use a restrained sidebar on desktop. On mobile: use a compact header and appropriate navigation.

Dashboard overview: recent shoppable images, clicks, views, CTR, recent activity. Do not invent fake numbers if there is no data.

Empty states should be useful. Example: "No shoppable images yet." / "Upload your first look to start adding product links."

============================================================
16. CANVA-LIKE IMAGE EDITOR
============================================================

Route: /admin/shoppable-images/[id]/edit

This is a major feature.

DESKTOP layout:
LEFT: tool rail
CENTER: canvas
RIGHT: properties panel
TOP: document title, save status, preview, publish
BOTTOM: zoom, undo, redo

MOBILE: adapt the editor intentionally. Do not just compress desktop panels. Use bottom sheets, collapsible tools, floating controls, touch-friendly interactions.

============================================================
17. EDITOR TOOLS
============================================================

Tools: Select, Add Product, Add Logo, Add Text, Duplicate, Delete

Canvas must support: pan, zoom, drag, resize, rotate, select, delete, duplicate.

Use React Konva. Use Konva Transformer for resizing and rotation. Every canvas object must have a stable ID.

============================================================
18. EDITOR HISTORY
============================================================

Implement Undo / Redo.

Keyboard: Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z

Track meaningful changes: add, remove, move, resize, rotate, property changes. Do not record every mousemove as a separate database write. Debounce updates.

============================================================
19. AUTOSAVE
============================================================

Autosave after approximately 800-1200ms of inactivity.

Display: Saving... / Saved / Unsaved changes

Avoid excessive writes. Only persist meaningful state. If save fails: show a clear error and retain unsaved local state.

============================================================
20. PRODUCT/HOTSPOT CREATION
============================================================

When admin clicks "Add Product": open a compact form.

Fields: product name, logo, product image, price (optional), marketplace (optional), affiliate URL, label (optional)

After saving: create hotspot, place it at a sensible default location, select it automatically. Then user can drag it anywhere.

============================================================
21. AFFILIATE REDIRECT
============================================================

Create: /go/[hotspotId]

Flow: visitor clicks hotspot → record analytics → redirect to affiliate URL

Validate URL. Only allow http:// and https://. Prevent open redirects. Do not trust a URL supplied by the client. Resolve the hotspot server-side. Track the event server-side where possible. Return an appropriate HTTP redirect.

============================================================
22. ANALYTICS
============================================================

Analytics is a first-class product feature.

Track: views, hotspot clicks, device, browser, operating system, viewport size, referrer, timestamp, session identifier, country when safely available, normalized click position.

Do NOT unnecessarily store raw IP addresses. Avoid collecting sensitive personal information.

Suggested click event:
{
  _id, hotspotId, shoppableImageId, ownerId, createdAt,
  sessionId, deviceType, browser, os,
  viewportWidth, viewportHeight, referrer, country,
  clickX, clickY
}

clickX and clickY: 0.0 - 1.0

============================================================
23. ANALYTICS DASHBOARD
============================================================

Route: /admin/analytics

Show: Total Views, Total Clicks, CTR, Unique Sessions

Filters: date range, image, category, hotspot, device

Charts: clicks over time, views over time, CTR over time, device distribution, browser distribution

Tables: top clicked products, top hotspots, top images, top categories, top referrers

Only show metrics supported by real data.

============================================================
24. IMAGE CLICK HEATMAP
============================================================

Because click coordinates are stored, create a visual heatmap view. Show the original image, overlay click density. This should help the creator understand: "Which area/product gets attention?"

Keep this as a clean analytical visualization. Do not make it look like a science dashboard.

============================================================
25. ANALYTICS DATA MODEL
============================================================

Create indexes appropriate for: ownerId, hotspotId, shoppableImageId, createdAt, sessionId

For time-series queries, ensure the schema supports efficient date-range filtering. Do not fetch every click event to the browser and calculate everything there. Aggregate on the server/database.

============================================================
26. CATEGORIES
============================================================

Initial categories: Fashion, Beauty, Accessories, Shoes, Bags, Lifestyle — but make them dynamic.

Category fields: name, slug, icon, description, coverImage, sortOrder, isActive

Admin can create, edit, reorder, archive.

============================================================
27. SEARCH
============================================================

Implement search for products, categories, collections, shoppable images.

Keep the search UI simple. Desktop: search in top navigation. Mobile: search accessible from header/navigation. Do not build a complex search engine for MVP. Use MongoDB indexes/search capabilities appropriate to the project.

============================================================
28. SEO
============================================================

Public pages need: title, description, canonical URL, Open Graph, social image, sitemap, robots.txt

Shoppable image pages should generate useful metadata from actual content. Do not create keyword-stuffed SEO text.

============================================================
29. PERFORMANCE
============================================================

Public storefront must be fast.

Use: Next.js Image, lazy loading, dynamic import for editor, avoid loading Konva on public pages unless needed, server components, caching where appropriate.

The editor bundle should NOT be loaded on normal storefront pages.

============================================================
30. RESPONSIVE BEHAVIOR
============================================================

Desktop: editorial layouts, top navigation, spacious image presentation
Tablet: adaptive two-column layouts
Mobile: single-column, bottom navigation, bottom sheets, large touch targets, image-first experience

Hotspots must remain accurately positioned. Never solve responsiveness by hardcoding separate hotspot coordinates for each device.

============================================================
31. ACCESSIBILITY
============================================================

Implement: semantic HTML, keyboard navigation, focus states, accessible dialogs, ARIA labels where necessary, reasonable contrast, minimum touch target around 44px

Hotspots must have accessible labels. Keyboard users must be able to interact with product links.

============================================================
32. SECURITY
============================================================

Implement: authentication, authorization, ownership checks, server-side validation, Zod schemas, safe redirects, upload validation, file size limits, MIME validation

Never expose: database credentials, private tokens, service credentials, storage secrets

Never trust: ownerId, hotspotId, affiliate URL, coordinates from the client without validation.

============================================================
33. ERROR HANDLING
============================================================

Create: loading states, error states, empty states, retry actions

Do not show raw stack traces to users. Use clear language, e.g.: "Something went wrong while saving your look. Your latest changes are still on this device."

============================================================
34. SEED DATA
============================================================

Create realistic demo data for development only: 5 categories, 5 shoppable images, 15 hotspots, 20 products, realistic click/view events.

Clearly separate demo seed data from production data. Do not use fake social proof in the public UI.

============================================================
35. EDITORIAL COPY
============================================================

Avoid generic AI marketing language.

Bad: "Discover a new world of fashion." / "Elevate your style with our innovative platform." / "Your ultimate destination for inspiration."

Prefer human, concise copy: "Shop the look." / "Seen in this look." / "Tap an item to see where it's from." / "Your looks." / "Add a product." / "Nothing here yet."

UI copy should sound natural.

============================================================
36. VISUAL DETAILS
============================================================

Use: subtle 1px borders, warm off-white surfaces, brown text, yellow/orange accents, restrained shadows, organic spacing, occasional asymmetry.

Corner radius: use a small number of consistent radius values. Do not make every element extremely rounded.

Avoid: excessive 24px/32px cards, excessive floating blobs, unnecessary gradients, excessive glass.

============================================================
37. ANIMATION
============================================================

Animations should be subtle. Use 150-250ms transitions, opacity, small translate, scale 0.98 → 1, gentle panel transitions.

Do not animate every component. Respect prefers-reduced-motion.

============================================================
38. PRODUCT DETAIL INTERACTION
============================================================

When a visitor clicks a hotspot:
Desktop: show a small anchored product card near the hotspot.
Mobile: show a bottom sheet.

Product card: logo, product image, title, optional price, marketplace, CTA: "Shop product"

Track click. Then redirect.

============================================================
39. PUBLIC URLS
============================================================

Public shoppable page: /p/[slug]
Affiliate redirect: /go/[hotspotId]
Admin editor: /admin/shoppable-images/[id]/edit
Analytics: /admin/analytics

============================================================
40. TESTING
============================================================

Add practical tests for: normalized coordinate conversion, URL validation, ownership checks, hotspot creation, hotspot update, affiliate redirect, analytics event creation

Do not spend time generating meaningless snapshot tests for every tiny component. Focus on business-critical behavior.

============================================================
41. CODE QUALITY
============================================================

TypeScript strict mode.

Avoid: any, duplicated business logic, giant components, unnecessary abstraction, unnecessary dependencies.

Use clear naming. Prefer explicit code over clever code. Comments should explain WHY, not WHAT.

============================================================
42. GIT / DEVELOPMENT WORKFLOW
============================================================

Before coding:
1. Inspect the repository.
2. Inspect package.json.
3. Inspect existing files.
4. Reuse useful existing infrastructure.
5. Do not overwrite existing work blindly.

Then implement incrementally. After meaningful milestones: run TypeScript check, run lint, run tests, run build. Fix errors instead of ignoring them.

============================================================
43. DEFINITION OF DONE
============================================================

The application is not done when the UI exists. It is done when a user can actually:

1. Register/login.
2. Enter admin.
3. Upload a full-body image.
4. Create a shoppable image.
5. Add a product hotspot.
6. Upload/select a logo.
7. Drag the hotspot onto the hijab.
8. Resize it.
9. Rotate it.
10. Add affiliate URL.
11. Save.
12. Preview.
13. Publish.
14. Open public page.
15. Tap/click hotspot.
16. See product information.
17. Click "Shop product".
18. Redirect to affiliate destination.
19. Record the click.
20. Open analytics.
21. See click count.
22. See device breakdown.
23. See browser/OS breakdown.
24. See click location.
25. Filter analytics by date/product/device.
26. Use the public site on mobile.
27. Use the editor on desktop.
28. Recover gracefully from errors.

============================================================
44. FINAL IMPLEMENTATION RULE
============================================================

Do not stop at a scaffold. Do not respond with only a plan. Actually implement the application.

If a requirement is ambiguous, choose the simplest sensible production implementation and continue. Do not ask unnecessary questions.

If a service is unavailable, isolate that integration behind a clean adapter so it can be replaced later.

Do not replace MongoDB Atlas with Supabase or Neon. Do not replace the requested architecture with another stack just because it is familiar.

The final result should feel like a real product that a small design-conscious startup could launch.

Most importantly: MAKE IT LOOK HUMAN-DESIGNED.

Less "AI dashboard". Less "template". Less "everything is a card".

More: editorial. warm. intentional. quiet. fashion. visual. useful.

Build the product.
```

---

## Catatan arsitektur yang sengaja dipilih

- Database: MongoDB Atlas. Supabase, Neon, Prisma, dan Drizzle secara eksplisit dilarang agar Claude Code tidak kembali memilih stack tersebut.
- File gambar: Vercel Blob sebagai storage terpisah dari database; bila repo sudah punya object storage, gunakan itu.

## Hal yang sengaja dibuat "anti AI slop"

- Tidak memakai purple/blue AI gradient atau dashboard SaaS generik.
- Tidak semua section dibuat menjadi card dengan border-radius besar.
- Tidak menggunakan copy marketing palsu atau angka statistik fiktif.
- Foto menjadi pusat pengalaman, bukan grid produk.
- Liquid glass hanya dipakai sebagai aksen (top bar desktop, bottom bar mobile, floating toolbar editor, popover hotspot).
- Layout editorial dibuat tidak terlalu simetris.
- Animasi dibatasi dan punya tujuan.
- Admin editor diperlakukan sebagai product studio, bukan template CRUD.
- Empty state dan microcopy dibuat pendek dan manusiawi.
- Claude diminta membaca repository sebelum mengubah apa pun.

## Flow utama produk

```
Creator
  ↓ Login
  ↓ Admin
  ↓ Upload foto full-body
  ↓ Open Image Editor
  ↓ Add Product
  ↓ Upload logo + affiliate URL
  ↓ Drag logo ke area pakaian (hijab/baju/tas/dll)
  ↓ Resize / Rotate
  ↓ Save (autosave)
  ↓ Preview
  ↓ Publish
  ↓ Public shoppable image (/p/[slug])
  ↓ Visitor tap hotspot
  ↓ Product card muncul
  ↓ Klik "Shop product"
  ↓ /go/[hotspotId]
  ↓ Analytics event tercatat
  ↓ Redirect ke affiliate destination
```

## Contoh data hotspot

```json
{
  "hotspotId": "...",
  "imageId": "...",
  "title": "Cream Hijab",
  "affiliateUrl": "https://example.com/...",
  "logoUrl": "...",
  "x": 0.73,
  "y": 0.31,
  "width": 0.08,
  "height": 0.08,
  "rotation": 0,
  "isActive": true
}
```

Nilai `x/y/width/height` disimpan **normalized 0–1**. Ini membuat hotspot tidak rusak ketika foto yang sama ditampilkan pada ukuran desktop, tablet, atau mobile yang berbeda.

## Urutan implementasi yang disarankan untuk Claude Code

1. Inspect repository dan environment.
2. Setup Next.js + TypeScript + Tailwind + design tokens (palette Aci).
3. Setup MongoDB Atlas connection dan models/collections.
4. Setup authentication dan protected admin routes.
5. Setup object storage abstraction (Vercel Blob).
6. Buat public storefront dasar.
7. Buat shoppable image viewer (`<ShoppableImage />`).
8. Buat React Konva editor.
9. Implement normalized coordinate system.
10. Implement hotspot CRUD.
11. Implement affiliate redirect (`/go/[hotspotId]`).
12. Implement click/view analytics.
13. Implement analytics dashboard.
14. Implement mobile navigation (bottom bar).
15. Implement liquid glass secara selektif.
16. Implement SEO/performance.
17. Test build, lint, typecheck, dan alur end-to-end.

## Cara pakai praktis

```bash
mkdir aci && cd aci
git init
claude
```

Lalu paste seluruh isi blok **PROMPT UTAMA** di atas sebagai pesan pertama ke Claude Code.

## Target akhir

Produk akhirnya harus terasa seperti platform affiliate visual yang punya identitas sendiri: foto sebagai media utama, hotspot sebagai layer commerce, dan analytics sebagai mesin feedback. Bukan marketplace generik dan bukan dashboard hasil generator UI.
