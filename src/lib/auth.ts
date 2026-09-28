import NextAuth, { type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { allowRateLimitedHit } from "@/lib/rate-limit";

/**
 * One NextAuth instance, two kinds of account:
 * - admin: the single owner, configured via ADMIN_EMAIL / ADMIN_PASSWORD_HASH;
 * - customer: by.narras shoppers, stored in MongoDB (email + password, or Google).
 * Every session carries a role, and admin-only code checks it with adminSession().
 */

export type Role = "admin" | "customer";

declare module "next-auth" {
  interface Session {
    role?: Role;
    customerId?: string;
  }
}

const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
export const isGoogleLoginEnabled = googleEnabled;

function clientIp(request: Request | undefined) {
  return request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/admin-login" },
  providers: [
    // Kept as the default "credentials" id so the admin login form is unchanged.
    Credentials({
      id: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

        if (!email || !password || !adminEmail || !adminPasswordHash) return null;
        if (!(await allowRateLimitedHit(clientIp(request), { scope: "login", max: 10 }))) return null;
        if (email.toLowerCase() !== adminEmail.toLowerCase()) return null;

        const valid = await bcrypt.compare(password, adminPasswordHash);
        if (!valid) return null;

        return { id: "seed-owner", email: adminEmail, name: "Admin", role: "admin" } as never;
      },
    }),
    Credentials({
      id: "customer",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;
        if (!(await allowRateLimitedHit(clientIp(request), { scope: "login", max: 10 }))) return null;

        // Loaded lazily so the /admin proxy never pulls in the database layer.
        const { getCustomerByEmail } = await import("@/lib/store/customers");
        const customer = await getCustomerByEmail(email);
        if (!customer?.passwordHash) return null;
        if (!(await bcrypt.compare(password, customer.passwordHash))) return null;

        return { id: customer._id, email: customer.email, name: customer.name, role: "customer" } as never;
      },
    }),
    ...(googleEnabled ? [Google] : []),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const { findOrCreateGoogleCustomer } = await import("@/lib/store/customers");
        const customer = await findOrCreateGoogleCustomer({
          email: profile.email,
          name: profile.name ?? profile.email.split("@")[0],
          googleId: account.providerAccountId,
        });
        token.role = "customer";
        token.customerId = customer._id;
        token.name = customer.name;
      } else if (user) {
        const role = (user as { role?: Role }).role;
        token.role = role;
        if (role === "customer") token.customerId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.role = token.role as Role | undefined;
      session.customerId = token.customerId as string | undefined;
      return session;
    },
  },
});

/** Sessions from before roles existed have no role; the owner's email still identifies them. */
export function isAdminSession(session: Session | null | undefined): boolean {
  if (!session) return false;
  if (session.role) return session.role === "admin";
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  return Boolean(adminEmail && session.user?.email?.toLowerCase() === adminEmail);
}

/** The session if it belongs to the admin, else null. Use this for everything under /admin and admin APIs. */
export async function adminSession(): Promise<Session | null> {
  const session = await auth();
  return isAdminSession(session) ? session : null;
}

/** The signed-in by.narras customer's id, or null. */
export async function customerId(): Promise<string | null> {
  const session = await auth();
  return session?.role === "customer" && session.customerId ? session.customerId : null;
}
