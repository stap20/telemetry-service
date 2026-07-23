// cypod-telemetry
import { ApplicationError } from './application.error';

export class ConflictError extends ApplicationError {
    constructor(
        message: string,
        translationKey?: string,
        params?: Record<string, string | number>,
    ) {
        super(message, translationKey, params);
    }
}
