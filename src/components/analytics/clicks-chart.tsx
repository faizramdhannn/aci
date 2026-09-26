"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useAdminDictionary } from "@/components/i18n/use-admin-dictionary";

export function ClicksChart({ data }: { data: { date: string; clicks: number; views: number }[] }) {
  const t = useAdminDictionary();
  if (data.length === 0) {
    return <p className="text-sm text-brown-soft">{t.analytics.chartEmpty}</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ left: -20, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#5A3D2B" strokeOpacity={0.08} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8A6A54" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#8A6A54" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: "#FDF9E3", border: "1px solid rgba(90,61,43,0.15)", borderRadius: 8 }}
        />
        <Line type="monotone" dataKey="views" name={t.analytics.chartViews} stroke="#8A6A54" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="clicks" name={t.analytics.chartClicks} stroke="#E5781E" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
