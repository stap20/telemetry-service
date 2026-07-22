// cypod-telemetry
import { ApplicationError } from './application.error';

export class UnauthorizedError extends ApplicationError {
    constructor(message: string) {
        super(message);
    }
}
