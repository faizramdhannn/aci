"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import type { CustomerAddress } from "@/types/store";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { useToast } from "@/components/ui/toast-provider";
import { authInput } from "@/components/store/account/auth-card";
import { format } from "@/lib/i18n/dictionaries";

const button =
  "rounded-full bg-brown px-5 py-2 text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-50";

function useErrorText() {
  const t = useStoreDictionary().account;
  return (data: { error?: string; field?: string }, fields: Record<string, string> = {}) =>
    format(t.errors[data.error as keyof typeof t.errors] ?? t.errors.generic, { field: fields[data.field ?? ""] ?? "" });
}

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const t = useStoreDictionary().account;
  const toast = useToast();
  const router = useRouter();
  const errorText = useErrorText();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const res = await fetch("/api/store/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), phone: form.get("phone") }),
    });
    setBusy(false);
    if (!res.ok) {
      toast(errorText(await res.json().catch(() => ({})), { name: t.name, phone: t.phone }), "error");
      return;
    }
    toast(t.profileSaved);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-xs text-brown-soft">{t.email}</span>
        <input value={email} disabled className={`${authInput} opacity-60`} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-xs text-brown-soft">{t.name}</span>
        <input name="name" defaultValue={name} required minLength={2} maxLength={80} className={authInput} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-xs text-brown-soft">{t.phone}</span>
        <input name="phone" type="tel" defaultValue={phone} placeholder="08…" className={authInput} />
      </label>
      <button type="submit" disabled={busy} className={button}>
        {t.save}
      </button>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const t = useStoreDictionary().account;
  const toast = useToast();
  const router = useRouter();
  const errorText = useErrorText();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setBusy(true);
    const res = await fetch("/api/store/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current: form.get("current") || undefined, next: form.get("next") }),
    });
    setBusy(false);
    if (!res.ok) {
      toast(errorText(await res.json().catch(() => ({})), {}), "error");
      return;
    }
    formEl.reset();
    toast(t.passwordChanged);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-3">
      {!hasPassword && <p className="text-sm text-brown-soft">{t.setPasswordIntro}</p>}
      {hasPassword && (
        <input
          name="current"
          type="password"
          required
          autoComplete="current-password"
          placeholder={t.currentPassword}
          aria-label={t.currentPassword}
          className={authInput}
        />
      )}
      <input
        name="next"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder={`${t.newPassword} — ${t.passwordHint.toLowerCase()}`}
        aria-label={t.newPassword}
        className={authInput}
      />
      <button type="submit" disabled={busy} className={button}>
        {t.savePassword}
      </button>
    </form>
  );
}

type Draft = Omit<CustomerAddress, "id"> & { id?: string };
const EMPTY: Draft = { label: "", recipient: "", phone: "", address: "", city: "", postalCode: "" };

export function AddressBook({
  addresses,
  defaultAddressId,
  fallback,
}: {
  addresses: CustomerAddress[];
  defaultAddressId?: string;
  /** Prefill for a first address. */
  fallback: { recipient: string; phone: string };
}) {
  const t = useStoreDictionary().account;
  const toast = useToast();
  const router = useRouter();
  const errorText = useErrorText();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [makeDefault, setMakeDefault] = useState(false);
  const [busy, setBusy] = useState(false);

  async function call(url: string, init: RequestInit) {
    setBusy(true);
    const res = await fetch(url, init);
    setBusy(false);
    if (!res.ok) {
      toast(
        errorText(await res.json().catch(() => ({})), {
          label: t.label,
          recipient: t.recipient,
          phone: t.phone,
          address: t.address,
          city: t.city,
          postalCode: t.postalCode,
        }),
        "error"
      );
      return false;
    }
    router.refresh();
    return true;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const ok = await call("/api/store/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, makeDefault }),
    });
    if (ok) {
      toast(t.addressSaved);
      setEditing(null);
    }
  }

  const set = (key: keyof Draft) => ({
    value: editing?.[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setEditing((d) => (d ? { ...d, [key]: e.target.value } : d)),
  });

  return (
    <div className="space-y-4">
      {addresses.length === 0 && !editing && <p className="text-sm text-brown-soft">{t.noAddresses}</p>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {addresses.map((a) => {
          const isDefault = a.id === defaultAddressId;
          return (
            <li key={a.id} className={`rounded-2xl border p-4 text-sm ${isDefault ? "border-brown" : "border-brown/15"}`}>
              <p className="flex items-center gap-2 font-semibold text-brown">
                {a.label}
                {isDefault && <span className="rounded-full bg-brown px-2 py-0.5 text-[10px] font-semibold text-cream">{t.default}</span>}
              </p>
              <p className="mt-1 text-brown">{a.recipient}</p>
              <p className="text-brown-soft">{a.phone}</p>
              <p className="text-brown-soft">
                {a.address}, {a.city} {a.postalCode}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(a);
                    setMakeDefault(isDefault);
                  }}
                  className="font-medium text-brown hover:underline"
                >
                  {t.edit}
                </button>
                {!isDefault && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => call(`/api/store/account/addresses?id=${encodeURIComponent(a.id)}`, { method: "PATCH" })}
                    className="text-brown-soft hover:text-brown"
                  >
                    {t.setDefault}
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(t.deleteConfirm)) call(`/api/store/account/addresses?id=${encodeURIComponent(a.id)}`, { method: "DELETE" });
                  }}
                  className="text-brown-soft hover:text-red-500"
                >
                  {t.delete}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {editing ? (
        <form onSubmit={onSubmit} className="max-w-lg space-y-3 rounded-2xl border border-brown/15 p-4">
          <h3 className="text-sm font-semibold text-brown">{editing.id ? t.editAddress : t.newAddress}</h3>
          <input required maxLength={40} placeholder={`${t.label} (${t.labelPlaceholder})`} aria-label={t.label} {...set("label")} className={authInput} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input required minLength={2} maxLength={80} placeholder={t.recipient} aria-label={t.recipient} {...set("recipient")} className={authInput} />
            <input required type="tel" placeholder={t.phone} aria-label={t.phone} {...set("phone")} className={authInput} />
          </div>
          <textarea required minLength={8} maxLength={400} rows={3} placeholder={t.address} aria-label={t.address} {...set("address")} className={authInput} />
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <input required minLength={2} maxLength={80} placeholder={t.city} aria-label={t.city} {...set("city")} className={authInput} />
            <input required inputMode="numeric" pattern="\d{5}" maxLength={5} placeholder={t.postalCode} aria-label={t.postalCode} {...set("postalCode")} className={authInput} />
          </div>
          <label className="flex items-center gap-2 text-sm text-brown">
            <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} className="accent-[var(--color-brown)]" />
            {t.makeDefault}
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={button}>
              {t.save}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-full px-4 py-2 text-sm text-brown-soft hover:text-brown">
              {t.cancel}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditing({ ...EMPTY, label: addresses.length === 0 ? t.defaultLabel : "", ...fallback });
            setMakeDefault(addresses.length === 0);
          }}
          className="rounded-full border border-brown/20 px-4 py-2 text-sm font-medium text-brown hover:bg-brown/5"
        >
          + {t.newAddress}
        </button>
      )}
    </div>
  );
}

export function LogoutButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/narras" })}
      className="rounded-full border border-brown/20 px-4 py-2 text-sm text-brown-soft hover:text-red-500"
    >
      {label}
    </button>
  );
}
