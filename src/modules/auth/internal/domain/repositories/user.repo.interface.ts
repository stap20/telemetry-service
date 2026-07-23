// cypod-telemetry
import { User } from '../entities/user.aggregate';
import { Email } from '../value-objects/email.vo';
import { UserId } from '../value-objects/user-id.vo';

export interface IUserRepository {
  getById(id: UserId): Promise<User | null>;
  getByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
}

export const IUserRepository = Symbol('IUserRepository');