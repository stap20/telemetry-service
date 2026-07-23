// cypod-telemetry
import { DomainError } from 'src/shared/domain/errors/domain.error';

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`Invalid email format: ${email}`);
  }
} 