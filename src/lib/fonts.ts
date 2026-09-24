import { Bebas_Neue, Caveat, Manrope, Playfair_Display } from "next/font/google";
import type { FontChoice } from "@/types";

// All site fonts are self-hosted via next/font (one download, no layout
// shift). Text annotations store a plain FontChoice name; fontFamilyFor maps
// it to next/font's generated family string, which is what a Konva <canvas>
// or an SVG <text> actually needs to resolve the font.
export const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["400", "700"] });
export const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: ["600", "700"] });
export const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["700"] });
export const bebas = Bebas_Neue({ variable: "--font-bebas", subsets: ["latin"], weight: ["400"] });

const FAMILY: Record<FontChoice, string> = {
  Manrope: manrope.style.fontFamily,
  Caveat: caveat.style.fontFamily,
  "Playfair Display": playfair.style.fontFamily,
  "Bebas Neue": bebas.style.fontFamily,
};

export function fontFamilyFor(choice: FontChoice | undefined): string {
  return FAMILY[choice ?? "Manrope"];
}

export const fontVariables = [manrope, caveat, playfair, bebas].map((f) => f.variable).join(" ");
