# Aci

Interactive Affiliate Visual Commerce Platform.

One photo → many clickable product hotspots → affiliate links → tracked analytics.

See [docs/PRD.md](docs/PRD.md) and [docs/DESIGN.md](docs/DESIGN.md) for the product spec and design system. [docs/CLAUDE_PROMPT.md](docs/CLAUDE_PROMPT.md) is the master prompt this build was implemented from.

## Status

Working MVP. Runs fully offline (no MongoDB, no Vercel Blob) using an in-memory seed dataset, so `npm run dev` works right after `npm install` with zero configuration. See **Known limitations** below for what's simplified compared to the full PRD.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- MongoDB (native driver) — optional, falls back to in-memory demo data
- Auth.js (NextAuth v5) — single admin account via env vars, no DB adapter
- React Konva — the drag/resize hotspot editor
- Recharts — analytics charts
- Vitest — unit tests
- Vercel Blob (optional) — real image uploads

No Supabase, Neon, Prisma, or Drizzle.

**Requires Node.js ≥ 20.9** (Next.js 16 won't build on older versions). If `node -v` shows something older and you have [nvm](https://github.com/nvm-sh/nvm), run `nvm use 20` (or 22/24) before the commands below — a couple of the fixes made during development were exactly this ("command not found" / DNS errors that went away once the right Node version was active).

## Quick start (no setup required)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The storefront and `/go/[hotspotId]` redirects work immediately against demo data — no `.env.local` needed. Changes made in the admin editor (new hotspots, new looks, publish/unpublish) persist in memory for as long as the dev server keeps running, then reset on restart.

This checkout already includes a working `.env.local` with a demo admin login, so `/admin` works out of the box too:

- **Email:** `admin@aci.local`
- **Password:** `aci-admin-2026`

`.env.local` is gitignored — replace it with your own credentials before you push this anywhere or treat it as more than a local demo. See **Full local setup** below for how.

## Full local setup (with a real database + login)

1. Copy the env template:

   ```bash
   cp .env.example .env.local
   ```

2. **Admin login.** Generate a bcrypt hash for whatever password you want:

   ```bash
   node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
   ```

   Put it in `.env.local` as `ADMIN_PASSWORD_HASH`, and set `ADMIN_EMAIL` to whatever email you want to sign in with.

   **Important gotcha:** Next.js expands `$` in `.env*` files to reference other variables (e.g. `$FOO`). A bcrypt hash is full of `$` (`$2b$10$...`), so paste it with every `$` escaped as `\$`, otherwise Next.js silently mangles the value and login fails with no useful error. Example:

   ```
   ADMIN_PASSWORD_HASH=\$2b\$10\$1vmNlD7zgMY1nzR5SdDlw.Woi5td0ndnxfj5FSASuT0mgYtYSjgVy
   ```

3. **Auth secret**, required by NextAuth to sign session tokens:

   ```bash
   openssl rand -base64 32
   ```

   Put the result in `AUTH_SECRET`.

4. **MongoDB (optional).** Without this, the app uses in-memory seed data (see Quick start above). To persist data for real:

   - Easiest: a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster, or
   - Locally via Docker: `docker run -d -p 27017:27017 --name aci-mongo mongo`

   Put the connection string in `MONGODB_URI`.

   Then seed it with the same demo data the in-memory fallback uses:

   ```bash
   npm run seed
   ```

5. **Image uploads (optional).** File upload works out of the box — drop a photo (JPEG/PNG/WEBP/GIF, up to 8MB) into the "Upload a look" form or the editor's "Change photo" panel, and it's saved to `public/uploads/` on your machine. That's fine for local development but won't survive a serverless deploy (ephemeral filesystem) or work with multiple server instances. For that, add a [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) store and put its token in `BLOB_READ_WRITE_TOKEN` — the same upload endpoint automatically switches to Blob storage when that's set, no code changes needed.

6. Run it:

   ```bash
   npm run dev
   ```

## Other commands

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
npm run test    # vitest (coordinate conversion, etc.)
npm run seed    # seed MongoDB with demo data (requires MONGODB_URI)
```

## What's implemented

- Public storefront (`/`, `/shop`, `/categories`, `/favorites`, `/p/[slug]`) with an editorial homepage, an auto-advancing hero carousel (5s interval, dot navigation, pauses correctly via cleanup), and a `<ShoppableImage />` component rendering hotspots over a photo
- Light/dark mode: follows the OS preference by default, toggle button persists an explicit choice to `localStorage` (`src/components/navigation/theme-toggle.tsx`, `src/app/globals.css`)
- Desktop top bar and mobile bottom bar, both with a liquid-glass (`backdrop-filter: blur`) treatment, plus a compact mobile top strip with the logo and search
- Custom logo (`public/aci-logo.png`) used across the top bar, admin sidebar, and login page
- Per-page browser tab titles via Next's metadata title template (`%s — Aci`), including dynamic ones for shoppable image and search-query pages
- Search popover: a search icon that expands an inline input beside it (desktop) or a compact button (mobile), submits to `/search`
- Hotspots link straight to the affiliate URL on click (`/go/[hotspotId]`, opens in a new tab) — no intermediate popup; the marker itself is a small colored SVG "link" badge, color customizable per hotspot
- Decorative arrow annotations (straight / curved / spiral), drawn like in Canva: pick a style, color, and size, then drag on the photo. Rendered with Konva in the editor and as a plain SVG overlay on the public page (`src/lib/arrow-shapes.ts`)
- `/go/[hotspotId]` affiliate redirect: server-side URL validation (http/https only), records a click event, then redirects
- View tracking on shoppable image pages (device/browser/OS parsed from the user agent, session cookie)
- Admin: email/password login (single account, env-configured), protected `/admin/*` routes via `src/proxy.ts`
- Image upload: drag-and-drop or file picker, validated server-side (type + 8MB size limit), saved to `public/uploads/` locally or Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set (`src/lib/storage.ts`) — used both when creating a new look and to replace an existing look's photo from the editor
- Admin overview, shoppable images list, and a Canva-like hotspot editor (React Konva: drag, resize + rotate via Transformer or a precise rotation slider, add/delete hotspots, autosave, publish/unpublish). "Add Product" opens as a modal popup with a marker-color picker; "Add Arrow" draws annotations
- Analytics dashboard: totals, CTR, clicks/views over time chart, top products, device breakdown
- Click heatmap per look (`/admin/shoppable-images/[id]/heatmap`): overlays each product's click count as a heat blob at its hotspot position — an approximation, since clicks are tracked per-hotspot rather than by raw pointer coordinate (see Known limitations)
- Category management (`/admin/categories`): create, rename, reorder (used as the public sort order), archive/restore, delete, and pick an icon from a curated lucide-react set (`src/components/admin/category-icons.tsx`) — also selectable when uploading a new look
- Site search (`/search`): matches shoppable image titles/descriptions and product (hotspot) names, case-insensitive; linked from the desktop top bar and a compact mobile search button
- Coordinate system: all hotspot and arrow positions are normalized (0–1) relative to the source image — see `src/lib/coordinates.ts` / `src/lib/arrow-shapes.ts` and their tests
- Data layer that transparently uses MongoDB when `MONGODB_URI` is set and reachable, or an in-memory store seeded with demo data otherwise (`src/lib/data.ts`)

## Known limitations

Compared to the full [PRD](docs/PRD.md), these are intentionally simplified to ship a working MVP:

- **Single admin account only**, configured via env vars — no multi-user/multi-tenant support, no signup flow.
- **Heatmap is per-hotspot, not per-pixel.** The "Shop product" CTA is a plain link (not a coordinate-tracked click), so the heatmap shows which *product* got clicked, placed at that hotspot's fixed position — not a true density map of exactly where on the photo people clicked. The `clickX`/`clickY` fields exist in the data model for that finer-grained version, just not populated yet.
- **Search is a simple substring match** (`$regex` in Mongo, `.includes()` in the in-memory fallback) — fine at this scale, not a real search engine (no ranking, typo tolerance, etc).
- **Analytics aggregation happens in Node**, not via MongoDB aggregation pipelines — fine at demo scale, would need revisiting for real traffic volume.
- **Favorites page is a stub** — no persistence.
- **Hotspot marker shape is fixed** (a small circular badge with a link icon). Color is customizable per hotspot; rotation is fully supported (drag the Transformer's rotate handle, or use the rotation slider) and persists correctly, but the badge looks the same at any angle — a small yellow dot on the canvas (editor only) marks which way it "faces" so the rotation is visible while editing.
- **A look's categories can only be set when it's first created** (in the "Upload a look" form) — there's no way to edit an existing look's categories from the editor yet.
- **Arrow annotations don't support editing their style after creation** — you can change color, thickness, and drag either end to move/resize, but switching straight ↔ curved ↔ spiral means deleting and redrawing.

## Deploying

- Push to GitHub, import into Vercel.
- Set the same environment variables from `.env.local` in the Vercel project settings (remembering the `$`-escaping gotcha above).
- Add a MongoDB Atlas connection string for `MONGODB_URI` — the in-memory fallback only makes sense for local development, since Vercel's serverless functions don't share memory between invocations.
- Run `npm run seed` locally against the production `MONGODB_URI` once, or build your own admin content from scratch via `/admin`.

## Project structure

```
src/
  app/
    (storefront routes: /, /shop, /categories, /favorites, /p/[slug])
    admin/            protected admin routes + layout
    admin-login/       login page (outside the admin layout on purpose)
    api/               route handlers (auth, shoppable-images, hotspots, analytics)
    go/[hotspotId]/     affiliate redirect
  components/
    navigation/         top bar, bottom bar
    storefront/         ShoppableImage, ProductPanel
    editor/              Konva hotspot editor, publish toggle
    analytics/           charts
  lib/                  mongodb, data access layer, memory store, auth, coordinates, user-agent parsing
  types/                 shared TypeScript types
  config/                site/nav config
scripts/
  seed.ts               seeds MongoDB with demo data
```
