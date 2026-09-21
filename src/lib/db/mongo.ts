import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB || "kshetramap";

declare global {
  // eslint-disable-next-line no-var
  var _kshetraMongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | undefined;

/** Cached MongoClient connection. Dev builds cache on `global` to survive HMR module reloads. */
export function getClient(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    if (!global._kshetraMongoClientPromise) {
      global._kshetraMongoClientPromise = new MongoClient(uri).connect();
    }
    return global._kshetraMongoClientPromise;
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(dbName);
}
