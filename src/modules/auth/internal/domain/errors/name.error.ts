// cypod-telemetry
import { DomainError } from "src/shared/domain/errors/domain.error";

export class EmptyNameError extends DomainError {
    constructor(field: 'firstName' | 'lastName') {
        super(`${field} cannot be empty`);
    }
}

export class NameTooShortError extends DomainError {
    constructor(field: 'firstName' | 'lastName') {
        super(`${field} must be at least 2 characters long`);
    }
}

export class NameTooLongError extends DomainError {
    constructor(field: 'firstName' | 'lastName') {
        super(`${field} cannot be longer than 50 characters`);
    }
}

export class InvalidNameFormatError extends DomainError {
    constructor(field: 'firstName' | 'lastName') {
        super(`${field} contains invalid characters`);
    }
}