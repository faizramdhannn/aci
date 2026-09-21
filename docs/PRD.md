# PRD — Aci

## 1. Ringkasan

**Aci** adalah platform affiliate visual commerce: creator mengunggah satu foto (biasanya fashion/lifestyle, full-body), lalu menempelkan hotspot produk langsung di atas foto tersebut. Setiap hotspot berisi link affiliate ke produk yang dipakai di foto itu. Pengunjung publik melihat foto, tap hotspot, lihat info produk, klik "Shop product", diarahkan ke link affiliate — dan setiap langkah tercatat di analitik.

Masalah yang diselesaikan: creator/reseller yang ingin memonetisasi outfit/produk lewat foto tunggal tanpa harus bikin katalog produk konvensional, dan ingin tahu performa tiap link (berapa kali diklik, dari device apa, posisi mana yang paling menarik perhatian).

## 2. Target pengguna

- **Admin/Creator** (pemilik akun `faizramdhan17@gmail.com` sebagai pengguna pertama): upload foto, pasang hotspot, kelola link affiliate, lihat analitik.
- **Visitor/pengunjung publik**: browsing storefront, tap hotspot, klik ke link affiliate. Tidak perlu akun.

## 3. Tujuan produk

1. Admin bisa upload 1 foto dan menempatkan banyak hotspot (logo + link) secara bebas di atas foto, seperti editor Canva.
2. Posisi hotspot tetap akurat di semua ukuran layar (desktop/tablet/mobile) — disimpan dalam koordinat normalized (0–1), bukan pixel absolut.
3. Pengunjung publik bisa menjelajah storefront yang terasa seperti editorial fashion, bukan grid e-commerce generik.
4. Setiap klik hotspot dan setiap view foto tercatat sebagai event analitik yang bisa difilter (tanggal, device, produk, gambar).
5. Tampilan memakai liquid glass secara selektif (top bar desktop, bottom bar mobile, toolbar editor, popover produk) dan palet warna hangat sesuai referensi.

## 4. Alur pengguna utama (user flow)

```
Admin login
  → masuk /admin
  → upload foto full-body
  → buka Image Editor
  → klik "Add Product"
  → isi nama produk, upload logo, isi affiliate URL, harga (opsional), marketplace (opsional)
  → hotspot otomatis dibuat & terpilih
  → drag hotspot ke area yang sesuai di foto (mis. hijab)
  → resize / rotate sesuai kebutuhan
  → autosave berjalan otomatis
  → preview
  → publish
  → foto tampil di halaman publik /p/[slug]

Visitor
  → buka halaman publik
  → lihat foto dengan hotspot kecil (logo/badge)
  → tap/klik hotspot
  → muncul product card (desktop: popover dekat hotspot; mobile: bottom sheet)
  → klik "Shop product"
  → event klik tercatat (server-side)
  → redirect ke /go/[hotspotId] → validasi URL → redirect ke affiliate URL
```

## 5. Fitur inti (scope MVP)

### 5.1 Autentikasi & Admin
- Login admin (email/password atau magic link).
- Route `/admin` terproteksi, setiap mutasi divalidasi kepemilikan (ownerId dari sesi, bukan dari client).

### 5.2 Upload & manajemen foto (Shoppable Image)
- Upload 1 foto ke object storage (Vercel Blob), bukan disimpan sebagai binary di database.
- Metadata: judul, slug, deskripsi, kategori, status (draft/published).

### 5.3 Editor hotspot (Canva-like)
- Canvas berbasis React Konva: pan, zoom, drag, resize, rotate, select, delete, duplicate.
- Tools: Select, Add Product, Add Logo, Add Text, Duplicate, Delete.
- Undo/redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z), history di-debounce, tidak setiap mousemove ditulis ke DB.
- Autosave ~800–1200ms setelah idle, dengan indikator "Saving... / Saved / Unsaved changes".
- Setiap hotspot punya field: judul, deskripsi, affiliate URL, logo, gambar produk, harga (opsional), marketplace (opsional), posisi (x, y, width, height, rotation — semua normalized 0–1), z-index, style, isActive.

### 5.4 Storefront publik
- Homepage editorial (bukan grid produk polos): hero foto besar, kategori, koleksi look terbaru.
- Rute: `/`, `/shop`, `/category/[slug]`, `/collection/[slug]`, `/p/[slug]`.
- Komponen inti `<ShoppableImage />`: render foto + hotspot + interaksi (hover di desktop, tap di mobile).
- Tidak perlu login untuk browsing atau klik ke affiliate link.

### 5.5 Affiliate redirect
- Rute `/go/[hotspotId]`: resolve hotspot di server, validasi URL (hanya http/https, cegah open redirect), catat event, lalu redirect.

### 5.6 Analitik
- Event yang direkam: view (per foto) dan click (per hotspot) — device type, browser, OS, viewport, referrer, timestamp, sessionId, country (jika tersedia aman), posisi klik normalized (clickX, clickY 0–1).
- Tidak menyimpan IP mentah atau data pribadi sensitif yang tidak perlu.
- Dashboard `/admin/analytics`: total views, total clicks, CTR, unique sessions; filter tanggal/gambar/kategori/hotspot/device; chart klik & view over time, distribusi device/browser; tabel top produk/hotspot/gambar/referrer.
- Heatmap visual: overlay densitas klik di atas foto asli, untuk melihat area mana yang paling menarik perhatian.

### 5.7 Kategori
- Kategori awal: Fashion, Beauty, Accessories, Shoes, Bags, Lifestyle — tapi dikelola dinamis oleh admin (create/edit/reorder/archive).

### 5.8 Navigasi
- Desktop: top bar dengan treatment liquid-glass tipis (logo kiri, menu tengah, search/favorit/profil kanan).
- Mobile: bottom navigation tetap (fixed), gaya iOS floating bar, dengan ikon + label + active state, mendukung safe-area insets. Kategori & logo bisa diakses dari bar ini.

### 5.9 Pencarian
- Search sederhana untuk produk, kategori, koleksi, dan shoppable image — tidak perlu search engine kompleks untuk MVP.

## 6. Di luar scope (untuk MVP)

- Pembayaran/checkout langsung di platform (semua transaksi terjadi di sisi marketplace afiliasi, bukan di Aci).
- Multi-tenant / banyak creator dalam satu akun (MVP: satu owner/admin dulu).
- Rekomendasi produk berbasis AI.
- Aplikasi mobile native.

## 7. Model data (ringkas)

Lihat detail penuh di [CLAUDE_PROMPT.md](CLAUDE_PROMPT.md) bagian 5–6 dan 22–25. Koleksi utama: `users`, `shoppableImages`, `hotspots`, `affiliateLinks`, `clickEvents`, `viewEvents`, `categories`, `collections`, `favorites`.

Prinsip kunci: koordinat hotspot (`x`, `y`, `width`, `height`) selalu disimpan **normalized 0–1** relatif terhadap dimensi asli foto — bukan pixel viewport — supaya posisi tidak berubah di berbagai ukuran layar.

## 8. Kriteria sukses (Definition of Done)

Produk dianggap selesai (MVP) ketika seorang admin bisa, end-to-end:

1. Login → masuk admin.
2. Upload foto full-body.
3. Buat shoppable image baru.
4. Tambah hotspot produk, upload logo, isi affiliate URL.
5. Drag, resize, rotate hotspot ke posisi yang tepat.
6. Perubahan tersimpan otomatis (autosave).
7. Preview lalu publish.
8. Buka halaman publik, tap hotspot, lihat product card, klik "Shop product", diarahkan ke tujuan affiliate.
9. Klik tercatat dan terlihat di `/admin/analytics` lengkap dengan breakdown device/browser/OS dan posisi klik.
10. Semua alur di atas berfungsi baik di desktop maupun mobile, dengan penanganan error yang jelas (bukan raw stack trace).

## 9. Prinsip desain non-negosiabel

- Foto adalah elemen utama; katalog produk sekunder.
- Tidak boleh terlihat seperti dashboard SaaS generik atau "AI slop" (lihat aturan lengkap di [DESIGN.md](DESIGN.md)).
- Liquid glass dipakai sebagai aksen, bukan seluruh permukaan UI.
- Copy UI singkat dan manusiawi, tanpa klaim/statistik palsu.
