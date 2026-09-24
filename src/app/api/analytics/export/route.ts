import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProductPerformance } from "@/lib/data";

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await getProductPerformance();
  const header = ["Product", "Look", "Categories", "Clicks"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [row.productTitle, row.lookTitle, row.categories, String(row.clicks)].map(csvCell).join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aci-product-performance-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
