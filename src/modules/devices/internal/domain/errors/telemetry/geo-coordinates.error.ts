// cypod-telemetry
import { ValidationDomainError } from 'src/shared/domain/errors/validation.domain.error';

export class InvalidLatitudeError extends ValidationDomainError {
    constructor(min: number, max: number) {
        super(
            `Latitude must be between ${min} and ${max}`,
            'devices.latitude_invalid',
            { min, max },
        );
    }
}

export class InvalidLongitudeError extends ValidationDomainError {
    constructor(min: number, max: number) {
        super(
            `Longitude must be between ${min} and ${max}`,
            'devices.longitude_invalid',
            { min, max },
        );
    }
}
