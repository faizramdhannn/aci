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
  type LucideIcon,
} from "lucide-react";

/** Curated icon set for category logos, picked from lucide-react. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  shirt: Shirt,
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
