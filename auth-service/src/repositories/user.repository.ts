import { Db, ObjectId } from 'mongodb';
import { getDb } from '../database';
import { User } from '../models/user';
import { RepoUser } from '../types/user';
import { normalizePagination } from '../../../libs/common/pagination';
import { PaginationOpts } from '../types/pagination';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { dbGuard } from '../../../libs/common/db-guard';

export default class UserRepository implements IUserRepository {
  private db: Db;
  constructor() {
    this.db = getDb();
  }

  private col() {
    return this.db.collection<User>('users');
  }

  async findByEmail(email: string) {
    const normalized = email.toLowerCase().trim();
    return dbGuard(() => this.col().findOne({ email: normalized }));
  }

  async findById(id: string) {
    const _id = new ObjectId(id);
    return dbGuard(() => this.col().findOne({ _id }));
  }

  // Create user: expects service to decide about password hashing
  async create(email: string, password: string, role: 'user' | 'admin' = 'user') {
    const userDto = { email: (email || '').toLowerCase().trim(), password, role: role || 'user', createdAt: new Date().toISOString() };
    return dbGuard(async () => {
      const insertResult = await this.col().insertOne(userDto as any);
      const createdUser = Object.assign({}, userDto, { _id: insertResult.insertedId });
      return createdUser;
    });
  }

  async updateRole(id: string, role: 'user' | 'admin') {
    const objectId = new ObjectId(id);
    return dbGuard(async () => {
      const updateResult = await this.col().updateOne({ _id: objectId }, { $set: { role } });
      return updateResult.modifiedCount > 0;
    });
  }

  // Return users with optional pagination and email search
  async list(opts?: PaginationOpts): Promise<{ rows: RepoUser[]; total: number }> {
    const { page, limit } = normalizePagination(opts, { page: 1, limit: 20 });
    const query: any = {};
    if (opts?.q) {
      query.email = { $regex: opts.q, $options: 'i' };
    }
    const collection = this.col();
    return dbGuard(async () => {
      const total = await collection.countDocuments(query);
      const rows = await collection.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray() as unknown as RepoUser[];
      return { rows, total };
    });
  }
}

export const userRepository: IUserRepository = new UserRepository();
