// cypod-telemetry
import { DomainError } from './domain.error';

export abstract class NotFoundDomainError extends DomainError {
    constructor(message: string) {
        super(message);
    }
}
