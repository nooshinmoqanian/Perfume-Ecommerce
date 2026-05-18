import { connectToDatabase, disconnectDatabase } from '../database';

const CATEGORIES = [
  'عمومی',
  'زنانه',
  'مردانه',
  'یونی‌سکس',
  'خنک',
  'گرم',
  'ملایم',
  'شیرین',
  'تلخ'
];

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory';
  const effectiveUri = mongoUri.includes('directConnection') ? mongoUri : (mongoUri.includes('?') ? `${mongoUri}&directConnection=true` : `${mongoUri}?directConnection=true`);
  console.log('[seed] connecting to', effectiveUri);
  const { collections } = await connectToDatabase(effectiveUri);

  try {
    await (collections.categories as any).createIndex({ name: 1 }, { unique: true });
  } catch (e) { /* ignore */ }

  for (const name of CATEGORIES) {
    try {
      const res = await (collections.categories as any).updateOne(
        { name },
        { $setOnInsert: { name, createdAt: new Date().toISOString() } },
        { upsert: true }
      );
      console.log('[seed] upserted', name);
    } catch (e) {
      console.warn('[seed] failed to upsert', name, e);
    }
  }

  console.log('[seed] done');
  await disconnectDatabase();
}

if (require.main === module) {
  run().catch(err => { console.error(err); process.exit(1); });
}
