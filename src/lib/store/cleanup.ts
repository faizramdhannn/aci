import { deleteImageIfUnused } from "@/lib/data";
import { getHubSettings, getStoreSettings } from "@/lib/store/data";

/** Deletes a replaced banner/cover image unless another hub or store setting (or a look) still uses it. */
export async function deleteSettingImageIfUnused(url: string | undefined): Promise<void> {
  if (!url) return;
  const [hub, store] = await Promise.all([getHubSettings(), getStoreSettings()]);
  if ([hub.outfitImage, hub.storeImage, hub.storeLogo, store.heroImage].includes(url)) return;
  await deleteImageIfUnused(url);
}
