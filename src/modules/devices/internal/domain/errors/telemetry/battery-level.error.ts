// cypod-telemetry
import { DomainError } from 'src/shared/domain/errors/domain.error';

export class InvalidBatteryLevelError extends DomainError {
    constructor() {
        super(
            'Battery level must be a whole number',
            'devices.battery_level_invalid',
        );
    }
}

export class BatteryLevelOutOfRangeError extends DomainError {
    constructor(min: number, max: number) {
        super(
            `Battery level must be between ${min} and ${max}`,
            'devices.battery_level_out_of_range',
            { min, max },
        );
    }
}
