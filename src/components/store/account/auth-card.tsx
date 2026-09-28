export const authInput =
  "w-full rounded-xl border border-brown/20 bg-surface px-3.5 py-2.5 text-sm text-brown outline-none focus:border-brown";
export const authButton =
  "w-full rounded-full bg-brown px-6 py-3 text-sm font-semibold text-cream transition-opacity hover:opacity-90 disabled:opacity-50";

export function AuthCard({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-md px-4 pt-10 sm:pt-16">
      <div className="rounded-3xl border border-brown/10 bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-brown">{title}</h1>
        {intro && <p className="mt-1 text-sm text-brown-soft">{intro}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
