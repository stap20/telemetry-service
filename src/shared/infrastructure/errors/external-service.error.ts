// cypod-telemetry
import { InfrastructureError } from './infrastructure.error';

export class ExternalServiceError extends InfrastructureError {
    constructor(message: string) {
        super(message);
    }
}
