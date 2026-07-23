// cypod-telemetry
import { DomainError } from 'src/shared/domain/errors/domain.error';

export class UserAlreadyExistsError extends DomainError {
    constructor(email: string) {
        super(`User with email ${email} already exists`, 'auth.user_already_exists', {
            email,
        });
    }
}
