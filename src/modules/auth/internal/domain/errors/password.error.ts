// cypod-telemetry
import { DomainError } from 'src/shared/domain/errors/domain.error';
import { ValidationDomainError } from 'src/shared/domain/errors/validation.domain.error';

export class InvalidPasswordError extends ValidationDomainError {
  constructor() {
    super('Password must be at least 6 characters long', 'auth.password_too_short', {
      min: 6,
    });
  }
}

// note: deliberately NOT a ValidationDomainError. Comparing against an unhashed password means the
// code built a Password the wrong way — it is an internal invariant violation, not something the
// caller sent. Answering 400 would blame the client for our bug, so this stays a plain DomainError
// (it also carries no translationKey, because no end user should ever be shown it).
export class UnhashedPasswordError extends DomainError {
  constructor() {
    super('Cannot compare unhashed password');
  }
}
