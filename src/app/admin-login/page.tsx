"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
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
      setError("Email or password doesn't match.");
      return;
    }

    router.push(searchParams.get("callbackUrl") || "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-brown/10 bg-white/40 p-6">
      <p className="mb-1 font-display text-2xl text-orange">Aci Studio</p>
      <h1 className="mb-6 text-lg font-semibold text-brown">Sign in to manage your looks</h1>

      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-brown-soft">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-brown/20 bg-cream px-3 py-2 outline-none focus:border-orange"
        />
      </label>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block text-brown-soft">Password</span>
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
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
