// cypod-telemetry
// src/modules/auth/internal/infrastructure/database/entities/user.entity.ts
export class UserEntity {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(data: Partial<UserEntity>) {
        Object.assign(this, data);
    }
}
