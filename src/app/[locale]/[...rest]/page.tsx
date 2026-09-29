import { notFound } from "next/navigation";

/** Any unknown path (rewritten under /[locale] by the proxy) gets the localized 404 page. */
export default function CatchAll() {
  notFound();
}
