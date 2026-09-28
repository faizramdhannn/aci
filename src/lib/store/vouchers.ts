import { randomUUID } from "crypto";
import { getDb } from "@/lib/mongodb";
import { getMemoryStore } from "@/lib/memory-store";
import type { StoreVoucher } from "@/types/store";
import { normalizeCode } from "@/lib/store/voucher-rules";

const COLLECTION = "vouchers";

export async function listVouchers(): Promise<StoreVoucher[]> {
  const db = await getDb();
  const all = db ? await db.collection<StoreVoucher>(COLLECTION).find().toArray() : [...getMemoryStore().vouchers];
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getVoucherByCode(code: string): Promise<StoreVoucher | null> {
  const c = normalizeCode(code);
  const db = await getDb();
  if (!db) return getMemoryStore().vouchers.find((v) => v.code === c) ?? null;
  return db.collection<StoreVoucher>(COLLECTION).findOne({ code: c });
}

export class VoucherCodeTaken extends Error {}

export async function saveVoucher(
  input: Omit<StoreVoucher, "_id" | "used" | "createdAt"> & { _id?: string }
): Promise<StoreVoucher> {
  const code = normalizeCode(input.code);
  const clash = await getVoucherByCode(code);
  if (clash && clash._id !== input._id) throw new VoucherCodeTaken();

  const db = await getDb();
  if (input._id) {
    const patch = { ...input, code };
    delete (patch as { _id?: string })._id;
    if (!db) {
      const v = getMemoryStore().vouchers.find((x) => x._id === input._id);
      if (v) Object.assign(v, patch);
      return v!;
    }
    await db.collection<StoreVoucher>(COLLECTION).updateOne({ _id: input._id }, { $set: patch });
    return (await db.collection<StoreVoucher>(COLLECTION).findOne({ _id: input._id }))!;
  }
  const voucher: StoreVoucher = { ...input, _id: randomUUID(), code, used: 0, createdAt: new Date().toISOString() };
  if (!db) getMemoryStore().vouchers.push(voucher);
  else await db.collection<StoreVoucher>(COLLECTION).insertOne(voucher);
  return voucher;
}

export async function deleteVoucher(id: string) {
  const db = await getDb();
  if (!db) {
    const store = getMemoryStore();
    store.vouchers = store.vouchers.filter((v) => v._id !== id);
    return;
  }
  await db.collection<StoreVoucher>(COLLECTION).deleteOne({ _id: id });
}

/** Counts one use, atomically refusing once the usage limit is reached. */
export async function claimVoucher(id: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    const v = getMemoryStore().vouchers.find((x) => x._id === id);
    if (!v || (v.maxUses != null && v.used >= v.maxUses)) return false;
    v.used += 1;
    return true;
  }
  const res = await db.collection<StoreVoucher>(COLLECTION).updateOne(
    {
      _id: id,
      $or: [{ maxUses: { $exists: false } }, { maxUses: null }, { $expr: { $lt: ["$used", "$maxUses"] } }],
    } as never,
    { $inc: { used: 1 } }
  );
  return res.modifiedCount === 1;
}

/** Gives a use back (cancelled order). */
export async function releaseVoucher(code: string) {
  const v = await getVoucherByCode(code);
  if (!v || v.used <= 0) return;
  const db = await getDb();
  if (!db) {
    v.used -= 1;
    return;
  }
  await db.collection<StoreVoucher>(COLLECTION).updateOne({ _id: v._id, used: { $gt: 0 } }, { $inc: { used: -1 } });
}
