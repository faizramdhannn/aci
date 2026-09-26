"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/navigation/logo";
import { useAdminDictionary } from "@/components/i18n/use-admin-dictionary";

export function LoginForm({ studio }: { studio: string }) {
  const router = useRouter();
  const t = useAdminDictionary();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t.login.failed);
      return;
    }

    router.push(searchParams.get("callbackUrl") || "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-brown/10 bg-surface/70 p-6">
      <p className="mb-1 flex items-center gap-2 font-display text-2xl text-orange">
        <Logo size={28} />
        {studio}
      </p>
      <h1 className="mb-6 text-lg font-semibold text-brown">{t.login.title}</h1>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-brown-soft">{t.login.email}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-brown/20 bg-cream px-3 py-2 outline-none focus:border-orange"
        />
      </label>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block text-brown-soft">{t.login.password}</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-brown/20 bg-cream px-3 py-2 outline-none focus:border-orange"
        />
      </label>

      {error && <p className="mb-4 text-sm text-orange">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-brown px-4 py-2.5 font-medium text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? t.login.submitting : t.login.submit}
      </button>
    </form>
  );
}
