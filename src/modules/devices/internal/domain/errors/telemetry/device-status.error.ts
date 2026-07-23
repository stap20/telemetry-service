// cypod-telemetry
import { ValidationDomainError } from 'src/shared/domain/errors/validation.domain.error';

export class EmptyDeviceStatusError extends ValidationDomainError {
    constructor() {
        super('Device status cannot be empty', 'devices.device_status_empty');
    }
}

export class InvalidDeviceStatusError extends ValidationDomainError {
    constructor(allowed: string) {
        super(
            `Device status must be one of: ${allowed}`,
            'devices.device_status_invalid',
            { allowed },
        );
    }
}
