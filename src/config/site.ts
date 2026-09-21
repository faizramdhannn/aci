export const siteConfig = {
  name: "Aci",
  description: "Tap an item in the photo to see where it's from.",
};

export const desktopNavItems = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/categories" },
];

export const mobileNavItems = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Explore", href: "/shop", icon: "explore" },
  { label: "Categories", href: "/categories", icon: "grid" },
  { label: "Favorites", href: "/favorites", icon: "heart" },
  { label: "Profile", href: "/admin", icon: "user" },
] as const;
