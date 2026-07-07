import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Connect to MongoDB. `autoIndex` is disabled in production because building
 * indexes on a 500k+ collection at boot is expensive — indexes should be
 * created ahead of time (see `npm run seed` / model index definitions and
 * `User.syncIndexes()`).
 */
export async function connectDB() {
  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(env.mongoUri, {
    autoIndex: env.nodeEnv !== 'production',
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20,
  });

  // eslint-disable-next-line no-console
  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
