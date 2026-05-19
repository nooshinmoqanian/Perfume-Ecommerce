import {
  Collection,
  Document,
  Filter,
  InsertOneResult,
  OptionalUnlessRequiredId,
  UpdateFilter,
  UpdateResult,
  WithId,
} from 'mongodb';
import { dbGuard } from '../../../libs/common/db-guard';

export default class BaseRepository<T extends Document> {
  protected collection: Collection<T>;

  constructor(collection: Collection<T>) {
    this.collection = collection;
  }

  create(doc: OptionalUnlessRequiredId<T>): Promise<InsertOneResult<T>> {
    return dbGuard(() => this.collection.insertOne(doc));
  }

  findAll(filter: Filter<T> = {}): Promise<WithId<T>[]> {
    return dbGuard(() => this.collection.find(filter).toArray());
  }

  update(filter: Filter<T>, patch: UpdateFilter<T>): Promise<UpdateResult<T>> {
    return dbGuard(() => this.collection.updateOne(filter, patch));
  }
}
