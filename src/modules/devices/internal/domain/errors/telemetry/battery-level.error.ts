// cypod-telemetry
import { ValidationDomainError } from 'src/shared/domain/errors/validation.domain.error';

export class InvalidBatteryLevelError extends ValidationDomainError {
    constructor() {
        super(
            'Battery level must be a whole number',
            'devices.battery_level_invalid',
        );
    }
}

export class BatteryLevelOutOfRangeError extends ValidationDomainError {
    constructor(min: number, max: number) {
        super(
            `Battery level must be between ${min} and ${max}`,
            'devices.battery_level_out_of_range',
            { min, max },
        );
    }
}
