import { MongoClient, type Db } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI is required');
}

const mongoUri = uri;

const globalForMongo = globalThis as typeof globalThis & {
  _jarjarMongoClient?: Promise<MongoClient>;
};

function createClient() {
  return new MongoClient(mongoUri, {
    connectTimeoutMS: 8000,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 20000,
    maxPoolSize: 10,
  }).connect();
}

async function getClient() {
  if (!globalForMongo._jarjarMongoClient) {
    globalForMongo._jarjarMongoClient = createClient();
  }

  try {
    return await globalForMongo._jarjarMongoClient;
  } catch (error) {
    globalForMongo._jarjarMongoClient = undefined;
    throw error;
  }
}

export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB || 'jarjar');
}
