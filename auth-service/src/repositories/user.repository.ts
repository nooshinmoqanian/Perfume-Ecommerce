import { Db, ObjectId } from 'mongodb';
import { getDb } from '../database';
import { User } from '../models/user';
import { RepoUser } from '../types/user';
import { normalizePagination } from '../../../libs/common/pagination';
import { PaginationOpts } from '../types/pagination';

export default class UserRepository {
  private db: Db;
  constructor() {
    this.db = getDb();
  }

  private col() {
    return this.db.collection<User>('users');
  }

  async findByEmail(email: string) {
    try {
      const normalized = email.toLowerCase().trim();
      return await this.col().findOne({ email: normalized });
    } catch (error) {
      console.warn('user.repository: findByEmail failed', error);
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const _id = new ObjectId(id);
      return await this.col().findOne({ _id });
    } catch (e) {
      console.warn('user.repository: findById failed', e);
      throw e;
    }
  }

  // Create user: expects service to decide about password hashing
  async create(email: string, password: string, role: 'user' | 'admin' = 'user') {
    try {
      const userDto = { email: (email || '').toLowerCase().trim(), password, role: role || 'user', createdAt: new Date().toISOString() };
      const insertResult = await this.col().insertOne(userDto as any);
      const createdUser = Object.assign({}, userDto, { _id: insertResult.insertedId });
      return createdUser;
    } catch (error) {
      console.warn('user.repository: create failed', error);
      throw error;
    }
  }

  async updateRole(id: string, role: 'user' | 'admin') {
    try {
      const objectId = new ObjectId(id);
      const updateResult = await this.col().updateOne({ _id: objectId }, { $set: { role } });
      return updateResult.modifiedCount > 0;
    } catch (error) {
      console.warn('user.repository: updateRole failed', error);
      throw error;
    }
  }

  // Return users with optional pagination and email search
  async list(opts?: PaginationOpts): Promise<{ rows: RepoUser[]; total: number }> {
    try {
      const { page, limit } = normalizePagination(opts, { page: 1, limit: 20 });
      const query: any = {};
      if (opts?.q) {
        query.email = { $regex: opts.q, $options: 'i' };
      }
      const collection = this.col();
      const total = await collection.countDocuments(query);
      const rows = await collection.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray() as unknown as RepoUser[];
      return { rows, total };
    } catch (error) {
      console.warn('user.repository: list failed', error);
      throw error;
    }
  }
}

export const userRepository = new UserRepository();
