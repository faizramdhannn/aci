"use client";

import { storeDictionaries, type StoreDictionary } from "@/lib/i18n/store-dictionaries";
import { useLocale } from "@/components/i18n/locale-provider";

export function useStoreDictionary(): StoreDictionary {
  return storeDictionaries[useLocale()];
}
