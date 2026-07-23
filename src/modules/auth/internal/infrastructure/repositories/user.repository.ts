// cypod-telemetry
// src/modules/auth/internal/infrastructure/repositories/user.repository.ts
import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repo.interface';
import { User } from '../../domain/entities/user.aggregate';
import { Email } from '../../domain/value-objects/email.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { IAuthPrismaClient } from '../database/auth.prisma.client.interface';
import { UserMapper } from '../database/mappers/user.mapper';

@Injectable()
export class UserRepository implements IUserRepository {
    constructor(
        @Inject(IAuthPrismaClient) private readonly prisma: IAuthPrismaClient,
        private readonly userMapper: UserMapper,
    ) {}

    async getById(id: UserId): Promise<User | null> {
        const userEntity = await this.prisma.user.findUnique({
            where: { id: id.value },
        });

        if (!userEntity) {
            return null;
        }

        return this.userMapper.toDomain(userEntity);
    }

    async getByEmail(email: Email): Promise<User | null> {
        const userEntity = await this.prisma.user.findUnique({
            where: { email: email.value },
        });

        if (!userEntity) {
            return null;
        }

        return this.userMapper.toDomain(userEntity);
    }

    async save(user: User): Promise<void> {
        const userData = this.userMapper.toPersistence(user);

        await this.prisma.user.upsert({
            where: { id: userData.id },
            update: {
                email: userData.email,
                password: userData.password,
                firstName: userData.firstName,
                lastName: userData.lastName,
                status: userData.status,
                updatedAt: new Date(),
            },
            create: userData,
        });
    }
}
