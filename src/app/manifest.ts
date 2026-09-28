import type { MetadataRoute } from "next";
import { HUB_NAME } from "@/config/site";

/** Lets visitors add narras to their home screen (Android install prompt, iOS "Add to Home Screen"). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: HUB_NAME,
    short_name: HUB_NAME,
    description: "Spill Outfit & by.narras",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fdf9e3",
    theme_color: "#fdf9e3",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "by.narras", url: "/narras", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Spill Outfit", url: "/outfit", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
