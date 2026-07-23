// cypod-telemetry
import { ValidationDomainError } from 'src/shared/domain/errors/validation.domain.error';

export class EmptyDeviceNameError extends ValidationDomainError {
    constructor() {
        super('Device name cannot be empty', 'devices.device_name_empty');
    }
}

export class DeviceNameTooShortError extends ValidationDomainError {
    constructor(min: number) {
        super(
            `Device name must be at least ${min} characters long`,
            'devices.device_name_too_short',
            { min },
        );
    }
}

export class DeviceNameTooLongError extends ValidationDomainError {
    constructor(max: number) {
        super(
            `Device name cannot be longer than ${max} characters`,
            'devices.device_name_too_long',
            { max },
        );
    }
}
