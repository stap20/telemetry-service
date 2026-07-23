// cypod-telemetry
import { ValidationDomainError } from 'src/shared/domain/errors/validation.domain.error';

export class EmptyUserIdError extends ValidationDomainError {
    constructor() {
        super('ID cannot be empty');
    }
}

export class InvalidUserIdFormatError extends ValidationDomainError {
    constructor() {
        super('Invalid ID format. Must be a valid UUID');
    }
} 