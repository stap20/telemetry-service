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

// note: a GPS module either has a fix or it does not — it cannot know a latitude while being
// ignorant of a longitude. One coordinate present and the other missing is therefore not a device
// without a fix, it is a payload that lost a field somewhere, and guessing which half to trust
// would put a device on a map at a place it has never been.
export class PartialGeoCoordinatesError extends ValidationDomainError {
    constructor() {
        super(
            'Latitude and longitude must be provided together',
            'devices.coordinates_partial',
        );
    }
}
