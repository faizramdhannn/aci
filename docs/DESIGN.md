# Design — Aci

## 1. Referensi visual

Moodboard referensi (lihat gambar yang dibagikan): ilustrasi bunga/vas bergaya retro-flat di atas warna kuning, dengan tipografi script "Limosin" untuk aksen dan sans-serif tebal untuk UI.

Palet warna:

| Nama | Hex | Peran |
|---|---|---|
| Cream | `#FDF9E3` | Background dominan |
| Yellow | `#FBBA00` | Aksen, CTA sekunder, highlight |
| Orange | `#E5781E` | Aksen utama, CTA primer, active state |
| Brown | `#5A3D2B` | Teks utama, UI gelap, navigasi |

Aturan pemakaian:
- Cream mendominasi background — jangan pakai putih polos atau hitam pekat di mana-mana.
- Brown untuk teks dan elemen UI gelap (bukan `#000000` murni).
- Yellow & orange dipakai **secukupnya** — untuk CTA, state aktif, badge terpilih, highlight — bukan untuk mewarnai setiap komponen.

Rasa visual yang ingin dicapai: hangat, editorial, sedikit handmade, playful, fashion-forward, agak retro, terasa premium tapi approachable — bukan techy/corporate.

## 2. Tipografi

- **UI/fungsional**: sans-serif modern yang rapi (contoh kandidat: Inter, General Sans, atau Manrope) untuk navigasi, form, tabel, label.
- **Display/aksen**: font script/expresif mirip "Limosin" pada referensi — dipakai terbatas: logo, judul section besar, quote singkat di halaman editorial. Jangan dipakai di body text atau UI fungsional.
- Hierarki jelas: heading besar tidak dipakai hanya untuk mengisi ruang; gunakan scale yang konsisten (mis. 14/16/20/28/40/56).

## 3. Prinsip "anti AI slop"

UI tidak boleh terasa seperti hasil generate template generik. Checklist sebelum implementasi tiap layar:

- Tidak semua elemen dibungkus card rounded-rectangle yang sama.
- Tidak semua section center-aligned simetris — boleh asimetris (1 gambar besar + 2 kecil, dsb).
- Tidak ada hero text generik ("Discover. Shop. Inspire.").
- Tidak ada statistik/testimoni/angka user palsu.
- Tidak setiap tombol pill-shaped; radius dibatasi 2–3 nilai konsisten saja.
- Glass/blur dipakai selektif (lihat bagian 5), bukan di seluruh halaman.
- Tidak setiap ikon dibungkus lingkaran.
- Animasi terbatas, tidak semua elemen bounce/float/glow.
- Tidak pakai gradasi ungu/biru bergaya "AI SaaS".
- Chart hanya ditampilkan jika menjawab pertanyaan produk nyata (jangan chart hiasan).
- Copy singkat dan manusiawi (lihat bagian 7).

## 4. Layout & komposisi

- **Homepage/storefront**: editorial, bukan grid kartu produk rapi. Contoh komposisi: 1 foto fitur besar + 2 foto pendukung lebih kecil, whitespace luas, sedikit asimetri.
- **Admin dashboard**: sidebar tipis di desktop, header ringkas di mobile — terasa seperti "studio" kerja, bukan template admin enterprise.
- **Editor hotspot**: 
  - Desktop: kiri = tool rail, tengah = canvas, kanan = panel properti, atas = judul dokumen/status simpan/preview/publish, bawah = zoom/undo/redo.
  - Mobile: bukan sekadar mengecilkan layout desktop — pakai bottom sheet, tool yang bisa di-collapse, kontrol mengambang, interaksi ramah sentuhan.

## 5. Liquid glass — di mana boleh, di mana tidak

**Boleh** (aksen):
- Top navigation bar (desktop)
- Bottom navigation bar (mobile)
- Kontrol foto yang mengambang (floating controls)
- Popover/product card saat hotspot diklik
- Filter controls di analitik
- Dialog ringkas
- Toolbar mengambang di editor

**Tidak boleh**:
- Product card di storefront
- Seluruh section halaman
- Semua tombol
- Semua panel admin

Teknik: `backdrop-filter: blur(...)`, background translucent, border tipis, highlight halus, shadow yang direstrain. Rasanya harus seperti "kaca di atas cream hangat", bukan tiruan literal situs Apple.

## 6. Navigasi

### Desktop (top bar)
```
[Logo Aci]     Home · Shop · Categories · Collections     [Search] [Favorites] [Profile]
```
Translucent cream/brown, bukan navbar biru/putih ala SaaS. Item menu dibatasi — jangan lebih dari yang perlu.

### Mobile (bottom bar)
```
[Home] [Explore] [Categories] [Favorites] [Profile]
```
Fixed di bawah, gaya floating iOS, ikon + label kecil + active state, aman dari safe-area insets, tidak menutupi konten.

## 7. Microcopy

Hindari bahasa marketing generik AI. Contoh yang **dihindari**:
- "Discover a new world of fashion."
- "Elevate your style with our innovative platform."

Contoh yang **dipakai**:
- "Shop the look."
- "Seen in this look."
- "Tap an item to see where it's from."
- "Your looks."
- "Add a product."
- "Nothing here yet." / "No shoppable images yet. Upload your first look to start adding product links."

## 8. Hotspot — desain visual

- Default: badge/logo kecil di atas foto, cukup terlihat tapi tidak merusak komposisi foto.
- State: idle, hover, selected, loading — transisi scale/opacity halus, hindari animasi pulsing terus-menerus.
- Admin bisa kustomisasi: logo, ukuran, border, shadow, label, animasi, rotasi.

## 9. Animasi

- Durasi 150–250ms.
- Gunakan opacity, translate kecil, scale 0.98→1, transisi panel halus.
- Hormati `prefers-reduced-motion`.
- Jangan animasikan semua komponen.

## 10. Aksesibilitas

- HTML semantik, navigasi keyboard, focus state jelas, dialog aksesibel, ARIA label bila perlu.
- Kontras warna cukup (perhatikan orange/yellow di atas cream — cek rasio kontras untuk teks).
- Target sentuh minimum ~44px.
- Hotspot harus punya label aksesibel dan bisa diakses via keyboard.

## 11. Referensi teknis styling

- Tailwind CSS dengan design tokens kustom untuk 4 warna di atas + varian tint/shade secukupnya.
- Radius: tentukan 2–3 nilai token (mis. `--radius-sm`, `--radius-md`) dan pakai konsisten — jangan nilai acak per komponen.
- Border: gunakan border 1px halus dengan warna brown/cream yang di-lower-opacity, bukan shadow tebal.
