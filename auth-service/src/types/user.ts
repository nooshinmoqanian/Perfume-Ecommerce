import { User } from '../models/user';

export type RepoUser = User & { _id?: { toString(): string } | string };
