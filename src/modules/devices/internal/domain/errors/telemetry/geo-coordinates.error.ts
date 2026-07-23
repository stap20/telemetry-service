// cypod-telemetry
import { DomainError } from 'src/shared/domain/errors/domain.error';

export class InvalidLatitudeError extends DomainError {
    constructor(min: number, max: number) {
        super(
            `Latitude must be between ${min} and ${max}`,
            'devices.latitude_invalid',
            { min, max },
        );
    }
}

export class InvalidLongitudeError extends DomainError {
    constructor(min: number, max: number) {
        super(
            `Longitude must be between ${min} and ${max}`,
            'devices.longitude_invalid',
            { min, max },
        );
    }
}
