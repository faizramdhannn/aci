import type { Metadata } from "next";
import { getAnalyticsSummary } from "@/lib/data";
import { ClicksChart } from "@/components/analytics/clicks-chart";
import { getAdminDictionary } from "@/lib/i18n/server";
import { format } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAdminDictionary()).analytics.title };
}
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [summary, t] = await Promise.all([getAnalyticsSummary(), getAdminDictionary()]);
  const clicks = (n: number) => format(t.common.clicks, { n });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brown">{t.analytics.title}</h1>
        <a
          href="/api/analytics/export"
          download
          className="rounded-full border border-brown/20 px-4 py-1.5 text-xs font-medium text-brown-soft transition-colors hover:text-brown"
        >
          {t.analytics.export}
        </a>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label={t.analytics.totalViews} value={summary.totalViews} />
        <Stat label={t.analytics.totalClicks} value={summary.totalClicks} />
        <Stat label={t.analytics.ctr} value={`${(summary.ctr * 100).toFixed(1)}%`} />
        <Stat label={t.analytics.sessions} value={summary.uniqueSessions} />
      </div>

      <div className="mb-8 rounded-xl border border-brown/10 bg-surface/70 p-4">
        <h2 className="mb-3 text-sm font-semibold text-brown">{t.analytics.overTime}</h2>
        <ClicksChart data={summary.clicksOverTime} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-brown/10 bg-surface/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-brown">{t.analytics.topProducts}</h2>
          {summary.topHotspots.length === 0 ? (
            <p className="text-sm text-brown-soft">{t.common.noClicks}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {summary.topHotspots.map((h) => (
                <li key={h.hotspotId} className="flex items-center justify-between">
                  <span className="text-brown">{h.title}</span>
                  <span className="text-brown-soft">{clicks(h.clicks)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-brown/10 bg-surface/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-brown">{t.analytics.topCategories}</h2>
          {summary.topCategories.length === 0 ? (
            <p className="text-sm text-brown-soft">{t.common.noClicks}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {summary.topCategories.map((c) => (
                <li key={c.categoryId} className="flex items-center justify-between">
                  <span className="text-brown">{c.name}</span>
                  <span className="text-brown-soft">{clicks(c.clicks)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-brown/10 bg-surface/70 p-4">
          <h2 className="mb-3 text-sm font-semibold text-brown">{t.analytics.byDevice}</h2>
          {summary.clicksByDevice.length === 0 ? (
            <p className="text-sm text-brown-soft">{t.common.noClicks}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {summary.clicksByDevice.map((d) => (
                <li key={d.device} className="flex items-center justify-between">
                  <span className="capitalize text-brown">{d.device}</span>
                  <span className="text-brown-soft">{clicks(d.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-brown/10 bg-surface/70 p-4">
      <p className="text-xs uppercase tracking-wide text-brown-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brown">{value}</p>
    </div>
  );
}
