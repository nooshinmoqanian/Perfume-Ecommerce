import { ClientSession, Collection, Filter, InsertOneResult, OptionalUnlessRequiredId, UpdateFilter } from 'mongodb';
import { dbGuard } from '../../../libs/common/db-guard';

export abstract class BaseRepository<T extends { id?: string }> {
  protected constructor(protected readonly collection: Collection<T>) {}

  protected buildFilter(id: string): Filter<T> {
    return { id } as Filter<T>;
  }

  protected buildSessionOpts(session?: ClientSession): { session?: ClientSession } | undefined {
    return session ? { session } : undefined;
  }

  protected toUpdateSummary(res: {
    matchedCount?: number;
    modifiedCount?: number;
    deletedCount?: number;
  }): { matched: boolean; modified: boolean } {
    const matchedCount = typeof res.matchedCount === 'number' ? res.matchedCount : undefined;
    const modifiedCount = typeof res.modifiedCount === 'number' ? res.modifiedCount : undefined;
    const deletedCount = typeof res.deletedCount === 'number' ? res.deletedCount : undefined;

    return {
      matched: (matchedCount ?? deletedCount ?? 0) > 0,
      modified: (modifiedCount ?? deletedCount ?? 0) > 0,
    };
  }

  protected insertOne(doc: T, session?: ClientSession): Promise<InsertOneResult<T>> {
    return dbGuard(() => this.collection.insertOne(doc as OptionalUnlessRequiredId<T>, this.buildSessionOpts(session)));
  }

  protected findOneById(id: string, session?: ClientSession): Promise<T | null> {
    return dbGuard(() => this.collection.findOne(this.buildFilter(id), this.buildSessionOpts(session)));
  }

  protected findAllDocs(session?: ClientSession): Promise<T[]> {
    return dbGuard(async () => {
      const docs = await this.collection.find({}, this.buildSessionOpts(session)).toArray();
      return docs as unknown as T[];
    });
  }

  protected updateOneById(id: string, update: UpdateFilter<T> | Partial<T>, session?: ClientSession) {
    return dbGuard(() => this.collection.updateOne(this.buildFilter(id), update as any, this.buildSessionOpts(session)));
  }

  protected deleteOneById(id: string, session?: ClientSession) {
    return dbGuard(() => this.collection.deleteOne(this.buildFilter(id), this.buildSessionOpts(session)));
  }
}
