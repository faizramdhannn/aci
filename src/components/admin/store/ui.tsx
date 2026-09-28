import Link from "next/link";
import type { OrderStatus } from "@/types/store";

/** Shopify-style building blocks for the by.narras admin. */

export function Card({ title, action, children, className = "" }: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-brown/10 bg-surface p-4 shadow-sm sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold text-brown">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, back, actions }: {
  title: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="mb-2 inline-block text-xs text-brown-soft hover:text-brown">
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-brown">{title}</h1>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

const STATUS_TONE: Record<OrderStatus, string> = {
  pending: "bg-amber-400/25 before:bg-amber-500",
  confirmed: "bg-sky-400/20 before:bg-sky-500",
  paid: "bg-emerald-400/20 before:bg-emerald-500",
  shipped: "bg-violet-400/20 before:bg-violet-500",
  completed: "bg-brown/10 before:bg-brown-soft",
  cancelled: "bg-red-400/20 before:bg-red-500",
};

export function StatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium text-brown before:h-1.5 before:w-1.5 before:rounded-full before:content-[''] ${STATUS_TONE[status]}`}
    >
      {label}
    </span>
  );
}

export function ProductStatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium text-brown ${
        active ? "bg-emerald-400/20" : "bg-brown/10"
      }`}
    >
      {label}
    </span>
  );
}

export const primaryButton =
  "rounded-full bg-brown px-4 py-2 text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-50";
export const secondaryButton =
  "rounded-full border border-brown/20 px-4 py-2 text-sm font-medium text-brown transition-colors hover:bg-brown/5 disabled:opacity-50";
export const adminInput =
  "w-full rounded-lg border border-brown/20 bg-cream/60 px-3 py-2 text-sm text-brown outline-none focus:border-brown";

export function formatDate(iso: string, locale: string, withTime = true) {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}
