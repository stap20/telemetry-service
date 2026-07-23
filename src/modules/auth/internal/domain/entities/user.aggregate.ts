// cypod-telemetry
// src/modules/auth/internal/domain/entities/user.aggregate.ts
import { AggregateRoot } from 'src/shared/domain/aggregate-root';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { Name } from '../value-objects/name.vo';
import { UserId } from '../value-objects/user-id.vo';
import { UserStatus } from '../value-objects/user-status.vo';

export interface CreateUserParams {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface PersistenceParams {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    status: string;
}

export class User extends AggregateRoot<UserId> {
    private email: Email;
    private password: Password;
    private name: Name;
    private status: UserStatus;

    private constructor(
        id: UserId,
        email: Email,
        password: Password,
        name: Name,
        status: UserStatus,
    ) {
        super(id);
        this.email = email;
        this.password = password;
        this.name = name;
        this.status = status;
    }

    public static async create(params: CreateUserParams): Promise<User> {
        const id = UserId.create(params.id);
        const email = Email.create(params.email);
        const password = await Password.create(params.password);
        const name = Name.create({
            firstName: params.firstName,
            lastName: params.lastName,
        });
        const status = UserStatus.active();

        return new User(id, email, password, name, status);
    }

    public static async createFromPersistence(
        params: PersistenceParams,
    ): Promise<User> {
        const id = UserId.create(params.id);
        const email = Email.create(params.email);
        const password = await Password.fromHashed(params.password);
        const name = Name.create({
            firstName: params.firstName,
            lastName: params.lastName,
        });
        const status = UserStatus.fromString(params.status);

        return new User(id, email, password, name, status);
    }

    public async validatePassword(plainPassword: string): Promise<boolean> {
        return this.password.match(plainPassword);
    }

    public getPassword(): Password {
        return this.password;
    }

    public getEmail(): Email {
        return this.email;
    }

    public getName(): Name {
        return this.name;
    }

    public getStatus(): UserStatus {
        return this.status;
    }

    public isActive(): boolean {
        return this.status.isActive();
    }

    public equals(other: User): boolean {
        if (!(other instanceof User)) {
            return false;
        }
        return this.email.equals(other.email);
    }
}
