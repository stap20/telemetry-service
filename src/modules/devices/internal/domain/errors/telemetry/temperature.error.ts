// cypod-telemetry
import { DomainError } from 'src/shared/domain/errors/domain.error';

export class InvalidTemperatureError extends DomainError {
    constructor() {
        super(
            'Temperature must be a valid number',
            'devices.temperature_invalid',
        );
    }
}

export class TemperatureOutOfRangeError extends DomainError {
    constructor(min: number, max: number) {
        super(
            `Temperature must be between ${min} and ${max} degrees Celsius`,
            'devices.temperature_out_of_range',
            { min, max },
        );
    }
}
