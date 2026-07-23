// cypod-telemetry
import { ValidationDomainError } from 'src/shared/domain/errors/validation.domain.error';

export class InvalidTemperatureError extends ValidationDomainError {
    constructor() {
        super(
            'Temperature must be a valid number',
            'devices.temperature_invalid',
        );
    }
}

export class TemperatureOutOfRangeError extends ValidationDomainError {
    constructor(min: number, max: number) {
        super(
            `Temperature must be between ${min} and ${max} degrees Celsius`,
            'devices.temperature_out_of_range',
            { min, max },
        );
    }
}
