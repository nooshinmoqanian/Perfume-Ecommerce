import { GridFSBucket, ObjectId } from 'mongodb';
import { getDb } from '../database';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { StorageError, NotFoundError } from '../errors/app-errors';

let bucket: GridFSBucket | null = null;

async function getBucket() {
  if (bucket) return bucket;
  const db = await getDb();
  bucket = new GridFSBucket(db, { bucketName: 'images' });
  return bucket;
}

export async function uploadBuffer(buffer: Buffer, filename: string, contentType?: string): Promise<string> {
  try {
    const bucket = await getBucket();
    const uploadStream = bucket.openUploadStream(filename, { metadata: { contentType } as any });

    await pipeline(Readable.from(buffer), uploadStream as unknown as NodeJS.WritableStream);

    return (uploadStream.id as ObjectId).toHexString();
  } catch (err: any) {
    console.error('[storage] uploadBuffer failed', err?.message || err);
    throw new StorageError(err?.message || 'Failed to upload to storage');
  }
}

export async function openDownloadStreamById(id: string) {
  let oid: ObjectId;
  try {
    oid = new ObjectId(id);
  } catch {
    throw new NotFoundError('Invalid image id');
  }

  try {
    const bucket = await getBucket();
    const files = await bucket.find({ _id: oid }).toArray();
    if (!files || files.length === 0) throw new NotFoundError('Image not found');
    return bucket.openDownloadStream(oid);
  } catch (err: any) {
    if (err instanceof NotFoundError) throw err;
    console.error('[storage] openDownloadStreamById failed', err?.message || err);
    throw new StorageError(err?.message || 'Failed to open download stream');
  }
}

export default { uploadBuffer, openDownloadStreamById };
