// cypod-telemetry
// src/modules/auth/internal/domain/errors/user.error.ts
import { DomainError } from 'src/shared/domain/errors/domain.error';

export class UserAlreadyExistsError extends DomainError {
    constructor(email: string) {
        super(`User with email ${email} already exists`);
    }
}
