// cypod-telemetry
// src/modules/devices/internal/presentation/dtos/requests/record-telemetry.request.dto.ts
import { IsNumber, IsEnum, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CoerceNumericString } from 'src/shared/infrastructure/decorators/coerce-numeric-string.decorator';
import { DeviceStatusValue } from '../../../domain/value-objects/telemetry/device-status.vo';

// note: this layer validates SHAPE (is it a number, is it a parseable date, is it a known status);
// the value objects own the business RANGES. Repeating "0-100" here as well would put the same rule
// in two files that can drift apart — and the range belongs to the domain, not to HTTP. The status
// enum is the one thing checked twice, and only because both checks read the same enum constant, so
// they cannot disagree; it earns its place by documenting the allowed values in Swagger.
// No `deviceId` field: the device comes from the URL and the owner from the JWT.
export class RecordTelemetryRequestDto {
    @ApiProperty({
        description: 'Battery charge remaining, as a percentage',
        example: 87.4,
    })
    @CoerceNumericString()
    @IsNumber()
    battery: number;

    @ApiProperty({
        description: 'Temperature reading in degrees Celsius',
        example: 21.5,
    })
    @CoerceNumericString()
    @IsNumber()
    temperature: number;

    // note: optional, and null is an accepted value rather than a rejected one — a device with no
    // GPS fix reports `lat: null, lng: null`, which is a true statement about where it is. The
    // aggregate still refuses one without the other; that rule is a domain rule, not a shape rule.
    @ApiProperty({
        description: 'Latitude of the reading, or null when the device has no GPS fix',
        example: 30.0444,
        required: false,
        nullable: true,
    })
    @IsOptional()
    @CoerceNumericString()
    @IsNumber()
    lat?: number | null;

    @ApiProperty({
        description: 'Longitude of the reading, or null when the device has no GPS fix',
        example: 31.2357,
        required: false,
        nullable: true,
    })
    @IsOptional()
    @CoerceNumericString()
    @IsNumber()
    lng?: number | null;

    // note: optional so a firmware build that omits the field still gets its battery and temperature
    // stored — those are what the alert rules run on. The aggregate records the absence as UNKNOWN
    // rather than assuming OK, so "the device did not say" never masquerades as "the device is fine".
    @ApiProperty({
        description: 'Reported device status; recorded as UNKNOWN when omitted',
        enum: DeviceStatusValue,
        example: DeviceStatusValue.OK,
        required: false,
    })
    @IsOptional()
    @IsEnum(DeviceStatusValue)
    status?: DeviceStatusValue;

    @ApiProperty({
        description: 'When the reading was taken on the device (ISO 8601)',
        example: '2026-07-23T09:15:00.000Z',
    })
    @Type(() => Date)
    @IsDate()
    timestamp: Date;
}
