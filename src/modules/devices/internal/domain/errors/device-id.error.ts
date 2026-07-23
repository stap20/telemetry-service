// cypod-telemetry
import { DomainError } from 'src/shared/domain/errors/domain.error';

export class EmptyDeviceIdError extends DomainError {
    constructor() {
        super('Device id cannot be empty', 'devices.device_id_empty');
    }
}

export class InvalidDeviceIdFormatError extends DomainError {
    constructor() {
        super(
            'Device id must be 3-100 characters and contain only letters, digits, dot, dash or underscore',
            'devices.device_id_invalid_format',
        );
    }
}
