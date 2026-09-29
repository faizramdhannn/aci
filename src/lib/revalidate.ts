import { revalidatePath } from "next/cache";

/**
 * Public pages are cached (ISR). After anything visitors can see changes —
 * an admin edit, a new order (stock), a comment or review — mark them all
 * stale so the next visit rebuilds them with fresh data.
 */
export function revalidateContent() {
  try {
    revalidatePath("/[locale]", "layout");
  } catch {
    /* outside a request (tests, scripts): nothing is cached */
  }
}

type Handler<C> = (request: Request, context: C) => Promise<Response> | Response;

/** Wraps a mutating route handler: on a successful response, invalidate cached pages. */
export function withRevalidate<C>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    const response = await handler(request, context);
    if (response.ok) revalidateContent();
    return response;
  };
}
