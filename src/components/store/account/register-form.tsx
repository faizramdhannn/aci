"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { GoogleButton } from "@/components/store/account/google-button";
import { authButton, authInput } from "@/components/store/account/auth-card";
import { format } from "@/lib/i18n/dictionaries";

export function RegisterForm({ callbackUrl, googleEnabled }: { callbackUrl: string; googleEnabled: boolean }) {
  const t = useStoreDictionary().account;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fieldLabel: Record<string, string> = { name: t.name, email: t.email, phone: t.phone, password: t.password };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(["name", "email", "phone", "password"].map((k) => [k, String(form.get(k) ?? "")]));
    setBusy(true);
    setError(null);
    const res = await fetch("/api/store/account/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const code = data.error as keyof typeof t.errors;
      setError(format(t.errors[code] ?? t.errors.generic, { field: fieldLabel[data.field] ?? "" }));
      setBusy(false);
      return;
    }
    await signIn("customer", { email: body.email, password: body.password, redirect: false });
    window.location.assign(callbackUrl);
  }

  return (
    <div className="space-y-4">
      {googleEnabled && (
        <>
          <GoogleButton label={t.google} callbackUrl={callbackUrl} />
          <p className="flex items-center gap-3 text-xs text-brown-soft before:h-px before:flex-1 before:bg-brown/15 after:h-px after:flex-1 after:bg-brown/15">
            {t.or}
          </p>
        </>
      )}
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder={t.name} aria-label={t.name} className={authInput} />
        <input name="email" type="email" required autoComplete="email" placeholder={t.email} aria-label={t.email} className={authInput} />
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          required
          pattern="^\+?[\d\s\-]{8,20}$"
          autoComplete="tel"
          placeholder={`${t.phone} (08…)`}
          aria-label={t.phone}
          className={authInput}
        />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder={`${t.password} — ${t.passwordHint.toLowerCase()}`}
          aria-label={t.password}
          className={authInput}
        />
        {error && (
          <p role="alert" className="text-sm text-orange">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={authButton}>
          {busy ? t.working : t.register}
        </button>
      </form>
      <p className="text-center text-sm text-brown-soft">
        {t.haveAccount}{" "}
        <Link href={`/narras/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-brown hover:underline">
          {t.login}
        </Link>
      </p>
    </div>
  );
}
