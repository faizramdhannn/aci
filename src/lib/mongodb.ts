import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;

let clientPromise: Promise<MongoClient> | null = null;

declare global {
   
  var _aciMongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> | null {
  if (!uri) return null;

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 2000,
    connectTimeoutMS: 2000,
  });

  if (process.env.NODE_ENV === "development") {
    // Reuse the connection across HMR reloads in dev.
    if (!global._aciMongoClientPromise) {
      global._aciMongoClientPromise = client.connect();
    }
    return global._aciMongoClientPromise;
  }

  if (!clientPromise) {
    clientPromise = client.connect();
  }
  return clientPromise;
}

/**
 * Returns a connected Db, or null if MONGODB_URI is unset or the server is
 * unreachable. Callers must fall back to seed data when this returns null —
 * the app is designed to run fully offline before Mongo is configured.
 */
export async function getDb(): Promise<Db | null> {
  const promise = getClientPromise();
  if (!promise) return null;

  try {
    const client = await promise;
    return client.db(process.env.MONGODB_DB_NAME || "aci");
  } catch (error) {
    console.warn("[aci] MongoDB unavailable, falling back to seed data:", (error as Error).message);
    return null;
  }
}
