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

- Public storefront (`/`, `/shop`, `/categories`, `/favorites`, `/p/[slug]`) with an editorial homepage and a `<ShoppableImage />` component rendering hotspots over a photo
- Desktop top bar and mobile bottom bar, both with a liquid-glass (`backdrop-filter: blur`) treatment
- Hotspot interaction: desktop popover, mobile bottom sheet, both showing product info and a "Shop product" CTA
- `/go/[hotspotId]` affiliate redirect: server-side URL validation (http/https only), records a click event, then redirects
- View tracking on shoppable image pages (device/browser/OS parsed from the user agent, session cookie)
- Admin: email/password login (single account, env-configured), protected `/admin/*` routes via `src/proxy.ts`
- Image upload: drag-and-drop or file picker, validated server-side (type + 8MB size limit), saved to `public/uploads/` locally or Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set (`src/lib/storage.ts`) — used both when creating a new look and to replace an existing look's photo from the editor
- Admin overview, shoppable images list, and a Canva-like hotspot editor (React Konva: drag, resize + rotate via Transformer or a precise rotation slider, add/delete hotspots, autosave, publish/unpublish)
- Analytics dashboard: totals, CTR, clicks/views over time chart, top products, device breakdown
- Coordinate system: all hotspot positions are normalized (0–1) relative to the source image — see `src/lib/coordinates.ts` and its tests
- Data layer that transparently uses MongoDB when `MONGODB_URI` is set and reachable, or an in-memory store seeded with demo data otherwise (`src/lib/data.ts`)

## Known limitations

Compared to the full [PRD](docs/PRD.md), these are intentionally simplified to ship a working MVP:

- **Single admin account only**, configured via env vars — no multi-user/multi-tenant support, no signup flow.
- **No heatmap visualization** of click density over the photo (click `clickX`/`clickY` are captured in the data model but nothing renders them as a heatmap yet).
- **No search implementation** — the search links in the nav currently just go to `/shop`.
- **Categories are read-only in the UI** — there's no admin screen to create/edit/reorder them yet (the data model and seed data support it).
- **Analytics aggregation happens in Node**, not via MongoDB aggregation pipelines — fine at demo scale, would need revisiting for real traffic volume.
- **Favorites page is a stub** — no persistence.
- **Hotspot shape is a fixed circle.** Rotation is fully supported (drag the Transformer's rotate handle, or use the rotation slider) and persists correctly, but a circle looks the same at any angle — a small yellow dot marks which way it "faces" so the rotation is visible while editing.

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
