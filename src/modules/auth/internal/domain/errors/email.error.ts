// cypod-telemetry
import { ValidationDomainError } from 'src/shared/domain/errors/validation.domain.error';

export class InvalidEmailError extends ValidationDomainError {
  constructor(email: string) {
    super(`Invalid email format: ${email}`, 'auth.invalid_email', { email });
  }
} 