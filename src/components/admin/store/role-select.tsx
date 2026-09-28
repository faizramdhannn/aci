"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { useToast } from "@/components/ui/toast-provider";

export function RoleSelect({ id, role, locked }: { id: string; role: "customer" | "admin"; locked?: "superadmin" | "you" }) {
  const t = useStoreDictionary().admin.customers;
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (locked) {
    return (
      <span className="rounded-full bg-brown px-2.5 py-0.5 text-xs font-semibold text-cream">
        {locked === "superadmin" ? t.superadmin : t.roles.admin}
      </span>
    );
  }

  return (
    <select
      value={role}
      disabled={busy}
      aria-label={t.role}
      onChange={async (e) => {
        const next = e.target.value;
        if (next === "admin" && !window.confirm(t.makeAdminConfirm)) return;
        setBusy(true);
        const res = await fetch(`/api/store/customers/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: next }),
        });
        setBusy(false);
        if (!res.ok) {
          toast(t.roleFailed, "error");
          return;
        }
        toast(t.roleSaved);
        router.refresh();
      }}
      className={`rounded-full border px-2.5 py-1 text-xs outline-none ${
        role === "admin" ? "border-brown bg-brown/10 font-semibold text-brown" : "border-brown/20 bg-surface text-brown"
      }`}
    >
      <option value="customer">{t.roles.customer}</option>
      <option value="admin">{t.roles.admin}</option>
    </select>
  );
}
