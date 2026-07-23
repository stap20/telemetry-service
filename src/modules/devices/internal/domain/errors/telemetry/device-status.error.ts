// cypod-telemetry
import { DomainError } from 'src/shared/domain/errors/domain.error';

export class EmptyDeviceStatusError extends DomainError {
    constructor() {
        super('Device status cannot be empty', 'devices.device_status_empty');
    }
}

export class InvalidDeviceStatusError extends DomainError {
    constructor(allowed: string) {
        super(
            `Device status must be one of: ${allowed}`,
            'devices.device_status_invalid',
            { allowed },
        );
    }
}
