// cypod-telemetry
import { DomainError } from './domain.error';

export abstract class NotFoundDomainError extends DomainError {
    constructor(
        message: string,
        translationKey?: string,
        params?: Record<string, string | number>,
    ) {
        super(message, translationKey, params);
    }
}
