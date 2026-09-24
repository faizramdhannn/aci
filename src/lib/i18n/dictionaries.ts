export const LOCALES = ["en", "id"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "aci_locale";

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "id";
}

const en = {
  nav: {
    home: "Home",
    shop: "Shop",
    explore: "Explore",
    categories: "Categories",
    favorites: "Favorites",
    search: "Search",
    searchPlaceholder: "Search…",
    language: "Language",
  },
  home: {
    eyebrow: "Your looks, shoppable.",
    headline: "Tap an item in the photo to see where it's from.",
    sub: "One photo, every piece linked. No account needed to shop the look.",
    yourLooks: "Latest looks",
    seeAll: "See all →",
    empty: "No looks yet — check back soon.",
    featured: "Featured",
  },
  shop: { title: "Shop", empty: "Nothing here yet." },
  categories: { title: "Categories", all: "All", empty: "Nothing here yet." },
  favorites: {
    title: "Favorites",
    loading: "Loading…",
    empty: "Nothing saved yet. Tap the heart on a look to save it here.",
    add: "Add to favorites",
    remove: "Remove from favorites",
  },
  search: {
    title: "Search",
    resultsFor: "Search: {q}",
    placeholder: "Search looks and products…",
    prompt: "Search for a look by name, or a product mentioned in one.",
    noMatch: "Nothing matched “{q}”.",
  },
  look: {
    itemsInLook: "Items in this look",
    shopOn: "Shop on {store}",
    shop: "Shop",
    tapHint: "Tap the dots on the photo to shop each item",
    dismiss: "Got it",
    noItems: "No items tagged in this look yet.",
    affiliateNote: "Links are affiliate links — I may earn a commission at no extra cost to you.",
  },
  card: { items: "{n} items", item: "1 item" },
  pagination: { previous: "← Previous", next: "Next →", pageOf: "Page {page} of {total}" },
  footer: {
    about: "About",
    follow: "Follow",
    contact: "Contact",
    privacy: "Privacy policy",
    disclosure: "Affiliate disclosure",
    rights: "All rights reserved.",
  },
  notFound: {
    eyebrow: "Hmm.",
    title: "This page doesn't exist",
    body: "The look or page you're looking for may have been moved, unpublished, or never existed.",
    back: "Back to home",
  },
  error: {
    eyebrow: "Oops.",
    title: "Something went wrong",
    body: "That's on us, not you. Try again, or come back in a moment.",
    retry: "Try again",
  },
  legal: {
    privacyTitle: "Privacy policy",
    privacyBody: [
      "This site doesn't require an account and doesn't ask for your name, email, or payment details.",
      "To understand which looks and products are useful, it records anonymous visit and click events: the page viewed, the product clicked, your device type, browser, and operating system, and where on the photo you tapped. These are tied to a random session ID stored in a cookie, not to you personally.",
      "Favorites and your language/theme choice are stored only in your own browser (localStorage/cookies) and never sent to us.",
      "When you tap a product, you're taken to a third-party store (e.g. Shopee, Tokopedia, TikTok Shop). Their own privacy policies apply from there.",
    ],
    disclosureTitle: "Affiliate disclosure",
    disclosureBody: [
      "Some or all product links on this site are affiliate links. If you buy something after tapping one, I may earn a small commission from the store.",
      "This never changes the price you pay.",
      "I only link products I've actually picked for a look. Commission doesn't decide what gets featured.",
    ],
  },
};

type Dictionary = typeof en;

const id: Dictionary = {
  nav: {
    home: "Beranda",
    shop: "Belanja",
    explore: "Jelajahi",
    categories: "Kategori",
    favorites: "Favorit",
    search: "Cari",
    searchPlaceholder: "Cari…",
    language: "Bahasa",
  },
  home: {
    eyebrow: "Look kamu, siap dibelanjakan.",
    headline: "Ketuk item di foto untuk tahu belinya di mana.",
    sub: "Satu foto, semua item ada link-nya. Tanpa perlu daftar akun.",
    yourLooks: "Look terbaru",
    seeAll: "Lihat semua →",
    empty: "Belum ada look — cek lagi nanti ya.",
    featured: "Pilihan",
  },
  shop: { title: "Belanja", empty: "Belum ada apa-apa di sini." },
  categories: { title: "Kategori", all: "Semua", empty: "Belum ada apa-apa di sini." },
  favorites: {
    title: "Favorit",
    loading: "Memuat…",
    empty: "Belum ada yang disimpan. Ketuk ikon hati di sebuah look untuk menyimpannya di sini.",
    add: "Tambah ke favorit",
    remove: "Hapus dari favorit",
  },
  search: {
    title: "Cari",
    resultsFor: "Cari: {q}",
    placeholder: "Cari look dan produk…",
    prompt: "Cari look berdasarkan nama, atau produk yang ada di dalamnya.",
    noMatch: "Tidak ada yang cocok dengan “{q}”.",
  },
  look: {
    itemsInLook: "Item di look ini",
    shopOn: "Beli di {store}",
    shop: "Beli",
    tapHint: "Ketuk titik di foto untuk belanja tiap item",
    dismiss: "Oke",
    noItems: "Belum ada item yang ditandai di look ini.",
    affiliateNote: "Link di sini adalah link afiliasi — saya bisa dapat komisi tanpa biaya tambahan untukmu.",
  },
  card: { items: "{n} item", item: "1 item" },
  pagination: { previous: "← Sebelumnya", next: "Berikutnya →", pageOf: "Halaman {page} dari {total}" },
  footer: {
    about: "Tentang",
    follow: "Ikuti",
    contact: "Kontak",
    privacy: "Kebijakan privasi",
    disclosure: "Pengungkapan afiliasi",
    rights: "Hak cipta dilindungi.",
  },
  notFound: {
    eyebrow: "Hmm.",
    title: "Halaman ini tidak ada",
    body: "Look atau halaman yang kamu cari mungkin sudah dipindah, tidak dipublikasikan, atau memang tidak pernah ada.",
    back: "Kembali ke beranda",
  },
  error: {
    eyebrow: "Ups.",
    title: "Ada yang salah",
    body: "Ini salah kami, bukan kamu. Coba lagi, atau kembali sebentar lagi.",
    retry: "Coba lagi",
  },
  legal: {
    privacyTitle: "Kebijakan privasi",
    privacyBody: [
      "Situs ini tidak memerlukan akun dan tidak meminta nama, email, atau data pembayaranmu.",
      "Untuk mengetahui look dan produk mana yang berguna, situs ini mencatat kunjungan dan klik secara anonim: halaman yang dilihat, produk yang diklik, jenis perangkat, browser, sistem operasi, dan posisi ketukan di foto. Data ini terhubung ke ID sesi acak yang disimpan di cookie, bukan ke identitasmu.",
      "Favorit serta pilihan bahasa/tema hanya disimpan di browser-mu sendiri (localStorage/cookie) dan tidak pernah dikirim ke kami.",
      "Saat kamu mengetuk produk, kamu akan dibawa ke toko pihak ketiga (misalnya Shopee, Tokopedia, TikTok Shop). Kebijakan privasi mereka yang berlaku setelah itu.",
    ],
    disclosureTitle: "Pengungkapan afiliasi",
    disclosureBody: [
      "Sebagian atau semua link produk di situs ini adalah link afiliasi. Jika kamu membeli sesuatu setelah mengetuknya, saya bisa mendapat komisi kecil dari toko.",
      "Ini tidak pernah mengubah harga yang kamu bayar.",
      "Saya hanya menautkan produk yang benar-benar saya pilih untuk sebuah look. Komisi tidak menentukan apa yang ditampilkan.",
    ],
  },
};

export const dictionaries: Record<Locale, Dictionary> = { en, id };
export type { Dictionary };

/** Replaces {name} placeholders: format("Page {page}", { page: 2 }). */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`));
}
