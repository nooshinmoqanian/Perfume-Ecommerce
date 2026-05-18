import { getCollections, connectToDatabase, disconnectDatabase } from '../database';

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory';
  console.log('[migrate] MONGO_URI=', process.env.MONGO_URI);
  console.log('[migrate] connecting to database...');
  // When connecting to a local Mongo that is part of a replica-set (inside Docker), the server
  // may advertise internal hostnames like `mongo:27017` that are not resolvable from the host.
  // For local migrations prefer `directConnection=true` to avoid driver trying to contact
  // the replica set members by advertised hostnames.
  const effectiveUri = mongoUri.includes('directConnection') ? mongoUri : (mongoUri.includes('?') ? `${mongoUri}&directConnection=true` : `${mongoUri}?directConnection=true`);
  console.log('[migrate] effective MONGO URI=', effectiveUri);
  const conn = await connectToDatabase(effectiveUri);
  const collections = conn.collections;

  try {
    console.log('[migrate] ensuring categories index...');
    await (collections.categories as any).createIndex({ name: 1 }, { unique: true });
  } catch (e) {
    console.warn('[migrate] could not create index', e);
  }

  try {
    console.log('[migrate] fetching distinct product categories...');
    const distinct: string[] = await (collections.products as any).distinct('category');
    const names = distinct.filter(Boolean);
    console.log(`[migrate] found ${names.length} distinct categories`);
    for (const name of names) {
      try {
        const res = await (collections.categories as any).findOneAndUpdate(
          { name },
          { $setOnInsert: { name, createdAt: new Date().toISOString() } },
          { upsert: true, returnDocument: 'after' }
        );
        const cat = res.value;
        if (cat && cat._id) {
          const idHex = cat._id.toHexString ? cat._id.toHexString() : String(cat._id);
          await (collections.products as any).updateMany({ category: name }, { $set: { categoryId: idHex } });
          console.log(`[migrate] synced category=${name} -> ${idHex}`);
        }
      } catch (err) {
        console.warn('[migrate] upsert failed for', name, err);
      }
    }
    console.log('[migrate] done');
  } catch (err) {
    console.error('[migrate] failed', err);
    process.exitCode = 2;
  } finally {
    await disconnectDatabase();
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
