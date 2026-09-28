import { createHash, randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { getMemoryStore } from "@/lib/memory-store";
import type { CartItem, Customer, CustomerAddress } from "@/types/store";

/** by.narras shopper accounts: profile, saved addresses, server-side cart, password reset tokens. */

const COLLECTION = "customers";
const TOKENS = "passwordResetTokens";
const RESET_TTL_MS = 60 * 60 * 1000;

export class CustomerError extends Error {
  constructor(public code: "email_taken" | "wrong_password" | "not_found" | "invalid_token") {
    super(code);
  }
}

export const hashPassword = (password: string) => bcrypt.hash(password, 10);

export async function getCustomerById(id: string): Promise<Customer | null> {
  const db = await getDb();
  if (!db) return getMemoryStore().customers.find((c) => c._id === id) ?? null;
  return db.collection<Customer>(COLLECTION).findOne({ _id: id });
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const normalized = email.trim().toLowerCase();
  const db = await getDb();
  if (!db) return getMemoryStore().customers.find((c) => c.email === normalized) ?? null;
  return db.collection<Customer>(COLLECTION).findOne({ email: normalized });
}

export async function listCustomers(): Promise<Customer[]> {
  const db = await getDb();
  if (!db) return [...getMemoryStore().customers].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return db.collection<Customer>(COLLECTION).find().sort({ createdAt: -1 }).toArray();
}

async function insertCustomer(customer: Customer): Promise<void> {
  const db = await getDb();
  if (!db) {
    getMemoryStore().customers.push(customer);
    return;
  }
  try {
    await db.collection<Customer>(COLLECTION).insertOne(customer);
  } catch (error) {
    // Unique index on email (see scripts): a concurrent sign-up with the same email.
    if ((error as { code?: number }).code === 11000) throw new CustomerError("email_taken");
    throw error;
  }
}

async function patchCustomer(id: string, patch: Partial<Customer>): Promise<void> {
  const next = { ...patch, updatedAt: new Date().toISOString() };
  const db = await getDb();
  if (!db) {
    const customer = getMemoryStore().customers.find((c) => c._id === id);
    if (customer) Object.assign(customer, next);
    return;
  }
  await db.collection<Customer>(COLLECTION).updateOne({ _id: id }, { $set: next });
}

export async function registerCustomer(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<Customer> {
  const email = input.email.trim().toLowerCase();
  if (await getCustomerByEmail(email)) throw new CustomerError("email_taken");
  const now = new Date().toISOString();
  const customer: Customer = {
    _id: randomUUID(),
    email,
    name: input.name.trim(),
    phone: input.phone.trim(),
    passwordHash: await hashPassword(input.password),
    addresses: [],
    cart: [],
    createdAt: now,
    updatedAt: now,
  };
  await insertCustomer(customer);
  return customer;
}

/** Google sign-in: links to an existing account with the same email, or creates one. */
export async function findOrCreateGoogleCustomer(input: { email: string; name: string; googleId: string }): Promise<Customer> {
  const existing = await getCustomerByEmail(input.email);
  if (existing) {
    if (!existing.googleId) await patchCustomer(existing._id, { googleId: input.googleId });
    return existing;
  }
  const now = new Date().toISOString();
  const customer: Customer = {
    _id: randomUUID(),
    email: input.email.trim().toLowerCase(),
    name: input.name,
    phone: "",
    googleId: input.googleId,
    addresses: [],
    cart: [],
    createdAt: now,
    updatedAt: now,
  };
  try {
    await insertCustomer(customer);
  } catch (error) {
    if (error instanceof CustomerError) return (await getCustomerByEmail(input.email))!;
    throw error;
  }
  return customer;
}

export async function updateProfile(id: string, patch: { name?: string; phone?: string }): Promise<void> {
  await patchCustomer(id, patch);
}

/** Google-only accounts may set a first password without a current one. */
export async function changePassword(id: string, current: string | undefined, next: string): Promise<void> {
  const customer = await getCustomerById(id);
  if (!customer) throw new CustomerError("not_found");
  if (customer.passwordHash && !(current && (await bcrypt.compare(current, customer.passwordHash)))) {
    throw new CustomerError("wrong_password");
  }
  await patchCustomer(id, { passwordHash: await hashPassword(next) });
}

// ── Addresses ───────────────────────────────────────────────────────────────

export async function saveAddress(
  id: string,
  address: Omit<CustomerAddress, "id"> & { id?: string },
  makeDefault: boolean
): Promise<CustomerAddress> {
  const customer = await getCustomerById(id);
  if (!customer) throw new CustomerError("not_found");
  const saved: CustomerAddress = { ...address, id: address.id || randomUUID() };
  const exists = customer.addresses.some((a) => a.id === saved.id);
  const addresses = exists
    ? customer.addresses.map((a) => (a.id === saved.id ? saved : a))
    : [...customer.addresses, saved];
  const defaultAddressId =
    makeDefault || !customer.defaultAddressId || addresses.length === 1 ? saved.id : customer.defaultAddressId;
  await patchCustomer(id, { addresses, defaultAddressId });
  return saved;
}

export async function deleteAddress(id: string, addressId: string): Promise<void> {
  const customer = await getCustomerById(id);
  if (!customer) return;
  const addresses = customer.addresses.filter((a) => a.id !== addressId);
  const defaultAddressId =
    customer.defaultAddressId === addressId ? addresses[0]?.id : customer.defaultAddressId;
  await patchCustomer(id, { addresses, defaultAddressId });
}

export async function setDefaultAddress(id: string, addressId: string): Promise<void> {
  const customer = await getCustomerById(id);
  if (!customer?.addresses.some((a) => a.id === addressId)) return;
  await patchCustomer(id, { defaultAddressId: addressId });
}

// ── Cart ────────────────────────────────────────────────────────────────────

export async function setCart(id: string, cart: CartItem[]): Promise<void> {
  await patchCustomer(id, { cart });
}

// ── Password reset ──────────────────────────────────────────────────────────

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Returns the raw token to email; only its hash is stored. */
export async function createResetToken(customerId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + RESET_TTL_MS);
  const record = { _id: hashToken(token), customerId, expiresAt: expires.toISOString() };
  const db = await getDb();
  if (!db) getMemoryStore().resetTokens.push(record);
  // expiresAtDate (a BSON Date) lets a TTL index clean up old tokens.
  else await db.collection(TOKENS).insertOne({ ...record, expiresAtDate: expires } as never);
  return token;
}

/** Sets a new password if the token is valid, then burns the token (and any others for that account). */
export async function resetPassword(token: string, password: string): Promise<void> {
  const id = hashToken(token);
  const db = await getDb();
  const record = db
    ? await db.collection<{ _id: string; customerId: string; expiresAt: string }>(TOKENS).findOne({ _id: id })
    : getMemoryStore().resetTokens.find((t) => t._id === id);
  if (!record || record.expiresAt < new Date().toISOString()) throw new CustomerError("invalid_token");

  await patchCustomer(record.customerId, { passwordHash: await hashPassword(password) });
  if (db) await db.collection<{ customerId: string }>(TOKENS).deleteMany({ customerId: record.customerId });
  else {
    const store = getMemoryStore();
    store.resetTokens = store.resetTokens.filter((t) => t.customerId !== record.customerId);
  }
}

/** What the account pages may see — never the password hash. */
export function publicCustomer(customer: Customer) {
  const { passwordHash, ...rest } = customer;
  return { ...rest, hasPassword: Boolean(passwordHash) };
}
export type PublicCustomer = ReturnType<typeof publicCustomer>;

// ── Wishlist ────────────────────────────────────────────────────────────────

/** Adds or removes a product; returns the new list (newest first). */
export async function toggleWishlist(id: string, productId: string): Promise<string[]> {
  const customer = await getCustomerById(id);
  if (!customer) throw new CustomerError("not_found");
  const current = customer.wishlist ?? [];
  const next = current.includes(productId) ? current.filter((p) => p !== productId) : [productId, ...current].slice(0, 200);
  await patchCustomer(id, { wishlist: next });
  return next;
}
