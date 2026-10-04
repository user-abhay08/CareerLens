import mongoose from 'mongoose';
import env from './env.js';

/**
 * Connects to MongoDB using MONGODB_URI when provided.
 * When no URI is configured (or the server is unreachable), falls back to an
 * auto-provisioned in-memory MongoDB so the project runs with zero setup.
 * Data in the fallback store is wiped on restart — set MONGODB_URI (e.g. a
 * free MongoDB Atlas cluster) for persistence.
 */
export async function connectDB() {
  if (env.mongodbUri) {
    try {
      await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 8000 });
      console.log(`[db] Connected to MongoDB`);
      return 'mongodb';
    } catch (err) {
      console.warn(`[db] Could not connect to MONGODB_URI (${err.message}). Falling back to in-memory MongoDB.`);
    }
  }
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri('careerlens'));
  console.log(`[db] Using in-memory MongoDB at ${mem.getUri('careerlens')} (data resets on restart)`);
  return 'memory';
}
