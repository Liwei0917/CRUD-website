/**
 * Seed script.
 *
 *   npm run seed                 -> ensures the default admin exists + a few demo users
 *   npm run seed -- --users 500000   -> bulk-inserts N extra demo users (batched)
 *
 * The bulk path uses a single pre-computed bcrypt hash and unordered
 * `insertMany` in batches so you can realistically populate a large collection
 * to test pagination/search/index performance.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import User, { ROLES } from './models/User.js';

function parseArgs(argv) {
  const args = { users: 0 };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--users') args.users = parseInt(argv[i + 1], 10) || 0;
  }
  return args;
}

async function ensureAdmin() {
  const existing = await User.findOne({ email: env.seedAdmin.email.toLowerCase() });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`Admin already exists: ${existing.email}`);
    return;
  }
  await User.create({
    name: env.seedAdmin.name,
    email: env.seedAdmin.email,
    password: env.seedAdmin.password,
    role: ROLES.ADMIN,
  });
  // eslint-disable-next-line no-console
  console.log(`Created admin: ${env.seedAdmin.email} / ${env.seedAdmin.password}`);
}

async function ensureDemoUsers() {
  const demo = [
    { name: 'Alice Johnson', email: 'alice@example.com' },
    { name: 'Bob Smith', email: 'bob@example.com' },
    { name: 'Carol Davis', email: 'carol@example.com' },
  ];
  for (const d of demo) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.exists({ email: d.email });
    // eslint-disable-next-line no-await-in-loop
    if (!exists) await User.create({ ...d, password: 'User@12345', role: ROLES.USER });
  }
  // eslint-disable-next-line no-console
  console.log('Demo users ensured (password: User@12345)');
}

async function bulkUsers(count) {
  const BATCH = 5000;
  const passwordHash = await bcrypt.hash('User@12345', env.bcryptSaltRounds);
  const startCount = await User.estimatedDocumentCount();
  let inserted = 0;

  while (inserted < count) {
    const size = Math.min(BATCH, count - inserted);
    const docs = new Array(size);
    for (let i = 0; i < size; i += 1) {
      const n = startCount + inserted + i;
      docs[i] = {
        name: `Test User ${n}`,
        email: `user${n}@example.com`,
        password: passwordHash,
        role: ROLES.USER,
        isActive: true,
      };
    }
    // ordered:false keeps going past duplicate-email collisions on re-runs.
    // eslint-disable-next-line no-await-in-loop
    await User.insertMany(docs, { ordered: false }).catch((e) => {
      if (e.code !== 11000) throw e;
    });
    inserted += size;
    // eslint-disable-next-line no-console
    console.log(`Inserted ${inserted}/${count}`);
  }
}

async function run() {
  const { users } = parseArgs(process.argv);
  await connectDB();

  await ensureAdmin();
  await ensureDemoUsers();

  if (users > 0) {
    // eslint-disable-next-line no-console
    console.log(`Bulk inserting ${users} demo users...`);
    await bulkUsers(users);
  }

  // Make sure all declared indexes exist (important before large queries).
  await User.syncIndexes();
  // eslint-disable-next-line no-console
  console.log('Indexes synced.');

  await disconnectDB();
  // eslint-disable-next-line no-console
  console.log('Seed complete.');
  process.exit(0);
}

run().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
