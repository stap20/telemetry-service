// cypod-telemetry
import { DomainError } from 'src/shared/domain/errors/domain.error';

export class InvalidPasswordError extends DomainError {
  constructor() {
    super('Password must be at least 6 characters long', 'auth.password_too_short', {
      min: 6,
    });
  }
}

export class UnhashedPasswordError extends DomainError {
  constructor() {
    super('Cannot compare unhashed password');
  }
} 