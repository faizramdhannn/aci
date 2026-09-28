/**
 * Transactional email through Resend's REST API (free tier: 3,000/month) —
 * no SDK dependency. Needs RESEND_API_KEY and RESEND_FROM (e.g.
 * "by.narras <noreply@yourdomain.com>"; without a verified domain Resend only
 * delivers from onboarding@resend.dev to your own address).
 * Without a key, development logs the email instead so the flow is testable.
 */
export const isEmailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);

export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html: string }) {
  if (!isEmailConfigured) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[aci] email (not sent — RESEND_API_KEY unset)\nTo: ${to}\nSubject: ${subject}\n\n${text}`);
      return;
    }
    throw new Error("Email is not configured (RESEND_API_KEY / RESEND_FROM).");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.RESEND_FROM, to, subject, text, html }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text().catch(() => "")}`);
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function resetPasswordEmail({ name, link, store }: { name: string; link: string; store: string }) {
  const text = `Halo ${name},\n\nKlik link ini untuk membuat password baru akun ${store} kamu (berlaku 1 jam):\n${link}\n\nKalau kamu tidak meminta reset password, abaikan email ini.`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;color:#3b2a1e">
<p>Halo ${escapeHtml(name)},</p>
<p>Klik tombol di bawah untuk membuat password baru akun ${escapeHtml(store)} kamu. Link berlaku 1 jam.</p>
<p><a href="${escapeHtml(link)}" style="display:inline-block;background:#5a3d2b;color:#fdf9e3;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Buat password baru</a></p>
<p style="font-size:13px;color:#8a6a54">Kalau kamu tidak meminta reset password, abaikan email ini.</p>
</div>`;
  return { subject: `Reset password ${store}`, text, html };
}
