import type { Metadata } from "next";
import { Manrope, Caveat } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast-provider";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aci — shop the look",
    template: "%s — Aci",
  },
  description: "Tap an item in the photo to see where it's from.",
  openGraph: {
    siteName: "Aci",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${caveat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Loaded under their real, global family names (not next/font's scoped
          class names) so the same fonts can be referenced by plain string in
          the editor's text-annotation tool — including inside a Konva
          <canvas>, which needs an actual resolvable font-family name.
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- this IS the root layout (App Router), the rule's pages-router premise doesn't apply */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700&family=Caveat:wght@600;700&family=Playfair+Display:wght@700&family=Bebas+Neue&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-brown" suppressHydrationWarning>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
