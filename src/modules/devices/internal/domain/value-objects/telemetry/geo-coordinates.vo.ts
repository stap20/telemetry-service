// cypod-telemetry
import { ValueObject } from 'src/shared/domain/value-objects/value-object';
import { ValueValidator } from 'src/shared/domain/value-objects/value-validator';
import {
    InvalidLatitudeError,
    InvalidLongitudeError,
} from '../../errors/telemetry/geo-coordinates.error';

export interface GeoCoordinatesValue {
    lat: number;
    lng: number;
}

// note: grouped VO — lat and lng are never meaningful apart, so they are validated and carried as
// one concept ("where the device was"). Keeping them as two loose numbers on the aggregate would
// let a half-valid position exist; here a position is either whole and valid, or it does not exist.
export class GeoCoordinates extends ValueObject<GeoCoordinatesValue> {
    private constructor(value: GeoCoordinatesValue) {
        super(value);
    }

    public static of(lat: number, lng: number): GeoCoordinates {
        this.validateLatitude(lat);
        this.validateLongitude(lng);

        return new GeoCoordinates({ lat, lng });
    }

    private static validateLatitude(lat: number): void {
        if (!ValueValidator.isLatitude(lat)) {
            throw new InvalidLatitudeError(
                ValueValidator.LATITUDE_MIN,
                ValueValidator.LATITUDE_MAX,
            );
        }
    }

    private static validateLongitude(lng: number): void {
        if (!ValueValidator.isLongitude(lng)) {
            throw new InvalidLongitudeError(
                ValueValidator.LONGITUDE_MIN,
                ValueValidator.LONGITUDE_MAX,
            );
        }
    }

    public get latitude(): number {
        return this._value.lat;
    }

    public get longitude(): number {
        return this._value.lng;
    }
}
