import { adminSession } from "@/lib/auth";
import { listOrders } from "@/lib/store/data";
import { ordersToCsv } from "@/lib/store/csv";
import { ORDER_STATUSES, type OrderStatus } from "@/types/store";

export async function GET(request: Request) {
  if (!(await adminSession())) return new Response("Unauthorized", { status: 401 });
  const raw = new URL(request.url).searchParams.get("status");
  const status = ORDER_STATUSES.includes(raw as OrderStatus) ? (raw as OrderStatus) : undefined;
  const orders = await listOrders({ status });
  const stamp = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
  return new Response(ordersToCsv(orders), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="narras-orders-${status ?? "all"}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
