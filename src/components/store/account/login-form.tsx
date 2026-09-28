"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { GoogleButton } from "@/components/store/account/google-button";
import { authButton, authInput } from "@/components/store/account/auth-card";

export function CustomerLoginForm({ callbackUrl, googleEnabled }: { callbackUrl: string; googleEnabled: boolean }) {
  const t = useStoreDictionary().account;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const res = await signIn("customer", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });
    if (res?.error) {
      setBusy(false);
      setError(t.loginFailed);
      return;
    }
    // Full navigation so the header and cart re-render with the new session.
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
        <input name="email" type="email" required autoComplete="email" placeholder={t.email} aria-label={t.email} className={authInput} />
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder={t.password}
          aria-label={t.password}
          className={authInput}
        />
        <div className="text-right">
          <Link href="/narras/forgot-password" className="text-xs text-brown-soft hover:text-brown">
            {t.forgot}
          </Link>
        </div>
        {error && (
          <p role="alert" className="text-sm text-orange">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={authButton}>
          {busy ? t.working : t.login}
        </button>
      </form>
      <p className="text-center text-sm text-brown-soft">
        {t.noAccount}{" "}
        <Link href={`/narras/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-semibold text-brown hover:underline">
          {t.register}
        </Link>
      </p>
    </div>
  );
}
