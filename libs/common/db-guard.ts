import DatabaseError from './db-error';

export async function dbGuard<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (err) {
    throw new DatabaseError('Database operation failed', err);
  }
}

export default dbGuard;
