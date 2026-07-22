// cypod-telemetry
import { InfrastructureError } from './infrastructure.error';

export class DatabaseError extends InfrastructureError {
    constructor(message: string) {
        super(message);
    }
}
