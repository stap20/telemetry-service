// cypod-telemetry
import { DomainError } from './domain.error';

// note: sibling of NotFoundDomainError, for the same reason. A bare DomainError maps to 409, which
// is right for a genuine conflict ("this device is already registered") but wrong for a malformed
// value — nothing is in conflict when a battery reading is 150, the request is simply bad. Without
// this distinction every failed value-object validation answers 409 and clients cannot tell "fix
// your payload" from "retry against different state".
export abstract class ValidationDomainError extends DomainError {
    constructor(
        message: string,
        translationKey?: string,
        params?: Record<string, string | number>,
    ) {
        super(message, translationKey, params);
    }
}
