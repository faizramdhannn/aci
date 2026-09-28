import NextAuth, { type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { allowRateLimitedHit } from "@/lib/rate-limit";
import { isSuperadminEmail } from "@/config/admins";

/**
 * One set of accounts (by.narras customers in MongoDB: email + password, or
 * Google). Accounts whose email is in SUPERADMIN_EMAILS get the "admin" role
 * and can use /admin; everyone else is a customer. The role is recomputed
 * from the email on every request, so changing the list takes effect
 * without logging out. Admin-only code checks it with adminSession().
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
  pages: { signIn: "/narras/login" },
  providers: [
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

        return { id: customer._id, email: customer.email, name: customer.name } as never;
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
        token.customerId = customer._id;
        token.name = customer.name;
        token.email = customer.email;
      } else if (user) {
        token.customerId = user.id;
      }
      token.role = isSuperadminEmail(token.email) ? "admin" : "customer";
      return token;
    },
    async session({ session, token }) {
      session.role = token.role as Role | undefined;
      session.customerId = token.customerId as string | undefined;
      return session;
    },
  },
});

export function isAdminSession(session: Session | null | undefined): boolean {
  return Boolean(session && session.role === "admin" && isSuperadminEmail(session.user?.email));
}

/** The session if it belongs to the admin, else null. Use this for everything under /admin and admin APIs. */
export async function adminSession(): Promise<Session | null> {
  const session = await auth();
  return isAdminSession(session) ? session : null;
}

/** The signed-in account's id (customer or superadmin — admins can shop too), or null. */
export async function customerId(): Promise<string | null> {
  const session = await auth();
  return session?.customerId ?? null;
}
