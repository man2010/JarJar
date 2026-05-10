import { MongoClient, type Db } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI is required');
}

let clientPromise: Promise<MongoClient>;

const globalForMongo = globalThis as typeof globalThis & {
  _jarjarMongoClient?: Promise<MongoClient>;
};

if (!globalForMongo._jarjarMongoClient) {
  globalForMongo._jarjarMongoClient = new MongoClient(uri).connect();
}

clientPromise = globalForMongo._jarjarMongoClient;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || 'jarjar');
}
