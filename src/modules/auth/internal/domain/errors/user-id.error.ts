// cypod-telemetry
import { DomainError } from 'src/shared/domain/errors/domain.error';

export class EmptyUserIdError extends DomainError {
    constructor() {
        super('ID cannot be empty');
    }
}

export class InvalidUserIdFormatError extends DomainError {
    constructor() {
        super('Invalid ID format. Must be a valid UUID');
    }
} 