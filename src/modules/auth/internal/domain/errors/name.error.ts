// cypod-telemetry
import { DomainError } from "src/shared/domain/errors/domain.error";

export class EmptyNameError extends DomainError {
    constructor(field: 'firstName' | 'lastName') {
        super(`${field} cannot be empty`, 'auth.name_empty', { field });
    }
}

export class NameTooShortError extends DomainError {
    constructor(field: 'firstName' | 'lastName') {
        super(`${field} must be at least 2 characters long`, 'auth.name_too_short', {
            field,
        });
    }
}

export class NameTooLongError extends DomainError {
    constructor(field: 'firstName' | 'lastName') {
        super(`${field} cannot be longer than 50 characters`, 'auth.name_too_long', {
            field,
        });
    }
}

export class InvalidNameFormatError extends DomainError {
    constructor(field: 'firstName' | 'lastName') {
        super(`${field} contains invalid characters`, 'auth.name_invalid_format', {
            field,
        });
    }
}