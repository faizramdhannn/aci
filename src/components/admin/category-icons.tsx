import {
  Shirt,
  ShoppingBag,
  Footprints,
  Watch,
  Gem,
  Glasses,
  Crown,
  Sparkles,
  Palette,
  Scissors,
  Umbrella,
  Backpack,
  Gift,
  Heart,
  Star,
  Flower2,
  Sun,
  Moon,
  Home,
  Camera,
  Music,
  Coffee,
  Dumbbell,
  Baby,
  Handbag,
  SportShoe,
} from "lucide-react";
import type { ComponentType } from "react";
import { DressIcon, HijabIcon, PantsIcon, SkirtIcon } from "@/components/admin/clothing-icons";

/** Curated icon set for category logos: lucide-react plus a few hand-drawn garments lucide lacks. */
export const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string; size?: number }>> = {
  shirt: Shirt,
  pants: PantsIcon,
  hijab: HijabIcon,
  dress: DressIcon,
  skirt: SkirtIcon,
  handbag: Handbag,
  "sport-shoe": SportShoe,
  "shopping-bag": ShoppingBag,
  footprints: Footprints,
  watch: Watch,
  gem: Gem,
  glasses: Glasses,
  crown: Crown,
  sparkles: Sparkles,
  palette: Palette,
  scissors: Scissors,
  umbrella: Umbrella,
  backpack: Backpack,
  gift: Gift,
  heart: Heart,
  star: Star,
  flower: Flower2,
  sun: Sun,
  moon: Moon,
  home: Home,
  camera: Camera,
  music: Music,
  coffee: Coffee,
  dumbbell: Dumbbell,
  baby: Baby,
};

export function CategoryIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = name ? CATEGORY_ICONS[name] : undefined;
  if (!Icon) return null;
  return <Icon className={className} />;
}
