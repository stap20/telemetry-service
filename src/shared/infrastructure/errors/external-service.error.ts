// cypod-telemetry
import { InfrastructureError } from './infrastructure.error';

export class ExternalServiceError extends InfrastructureError {
    constructor(
        message: string,
        translationKey?: string,
        params?: Record<string, string | number>,
    ) {
        super(message, translationKey, params);
    }
}
