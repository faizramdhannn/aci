"use client";

import { adminDictionaries, type AdminDictionary } from "@/lib/i18n/admin-dictionaries";
import { useLocale } from "@/components/i18n/locale-provider";

// Separate module so storefront bundles never pull in the admin strings.
export function useAdminDictionary(): AdminDictionary {
  return adminDictionaries[useLocale()];
}
