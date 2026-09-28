"use client";

import { useState } from "react";
import Link from "next/link";
import { useStoreDictionary } from "@/components/i18n/use-store-dictionary";
import { authButton, authInput } from "@/components/store/account/auth-card";

export function ForgotPasswordForm() {
  const t = useStoreDictionary().account;
  const [state, setState] = useState<"idle" | "busy" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy");
    setError(null);
    const res = await fetch("/api/store/account/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(new FormData(e.currentTarget).get("email") ?? "") }),
    });
    if (!res.ok) {
      const code = (await res.json().catch(() => ({}))).error as keyof typeof t.errors;
      setError((t.errors[code] ?? t.errors.generic).replace("{field}", t.email));
      setState("idle");
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-brown">{t.linkSent}</p>
        <Link href="/narras/login" className="font-semibold text-brown hover:underline">
          {t.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input name="email" type="email" required autoComplete="email" placeholder={t.email} aria-label={t.email} className={authInput} />
      {error && (
        <p role="alert" className="text-sm text-orange">
          {error}
        </p>
      )}
      <button type="submit" disabled={state === "busy"} className={authButton}>
        {state === "busy" ? t.working : t.sendLink}
      </button>
      <p className="text-center text-sm">
        <Link href="/narras/login" className="text-brown-soft hover:text-brown">
          {t.backToLogin}
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useStoreDictionary().account;
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy");
    setError(null);
    const res = await fetch("/api/store/account/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: String(new FormData(e.currentTarget).get("password") ?? "") }),
    });
    if (!res.ok) {
      const code = (await res.json().catch(() => ({}))).error as keyof typeof t.errors;
      setError((t.errors[code] ?? t.errors.generic).replace("{field}", t.newPassword));
      setState("idle");
      return;
    }
    setState("done");
  }

  if (state === "done") {
    return (
      <div className="space-y-4 text-sm">
        <p className="text-brown">{t.passwordReset}</p>
        <Link href="/narras/login" className={`${authButton} block text-center`}>
          {t.login}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder={`${t.newPassword} — ${t.passwordHint.toLowerCase()}`}
        aria-label={t.newPassword}
        className={authInput}
      />
      {error && (
        <p role="alert" className="text-sm text-orange">
          {error}
        </p>
      )}
      <button type="submit" disabled={state === "busy"} className={authButton}>
        {state === "busy" ? t.working : t.savePassword}
      </button>
    </form>
  );
}
