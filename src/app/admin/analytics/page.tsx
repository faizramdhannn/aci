import { getAnalyticsSummary } from "@/lib/data";
import { ClicksChart } from "@/components/analytics/clicks-chart";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const summary = await getAnalyticsSummary();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-brown">Analytics</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total Views" value={summary.totalViews} />
        <Stat label="Total Clicks" value={summary.totalClicks} />
        <Stat label="CTR" value={`${(summary.ctr * 100).toFixed(1)}%`} />
        <Stat label="Unique Sessions" value={summary.uniqueSessions} />
      </div>

      <div className="mb-8 rounded-xl border border-brown/10 bg-white/40 p-4">
        <h2 className="mb-3 text-sm font-semibold text-brown">Clicks &amp; views over time</h2>
        <ClicksChart data={summary.clicksOverTime} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-brown/10 bg-white/40 p-4">
          <h2 className="mb-3 text-sm font-semibold text-brown">Top products</h2>
          {summary.topHotspots.length === 0 ? (
            <p className="text-sm text-brown-soft">No clicks recorded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {summary.topHotspots.map((h) => (
                <li key={h.hotspotId} className="flex items-center justify-between">
                  <span className="text-brown">{h.title}</span>
                  <span className="text-brown-soft">{h.clicks} clicks</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-brown/10 bg-white/40 p-4">
          <h2 className="mb-3 text-sm font-semibold text-brown">Clicks by device</h2>
          {summary.clicksByDevice.length === 0 ? (
            <p className="text-sm text-brown-soft">No clicks recorded yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {summary.clicksByDevice.map((d) => (
                <li key={d.device} className="flex items-center justify-between">
                  <span className="capitalize text-brown">{d.device}</span>
                  <span className="text-brown-soft">{d.count} clicks</span>
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
    <div className="rounded-xl border border-brown/10 bg-white/40 p-4">
      <p className="text-xs uppercase tracking-wide text-brown-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brown">{value}</p>
    </div>
  );
}
