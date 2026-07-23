// cypod-telemetry
import { User } from '../entities/user.aggregate';
import { Email } from '../value-objects/email.vo';
import { UserId } from '../value-objects/user-id.vo';

export interface IUserRepository {
  // note: identity generation is an infrastructure concern (which id strategy — uuid, cuid, db
  // sequence — is a persistence detail). The handler asks the repo for an id instead of importing
  // `crypto` itself, so the application layer stays free of infrastructure imports.
  generateId(): string;
  getById(id: UserId): Promise<User | null>;
  getByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
}

export const IUserRepository = Symbol('IUserRepository');