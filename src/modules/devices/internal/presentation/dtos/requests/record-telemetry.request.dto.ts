// cypod-telemetry
// src/modules/devices/internal/presentation/dtos/requests/record-telemetry.request.dto.ts
import { IsInt, IsNumber, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DeviceStatusValue } from '../../../domain/value-objects/telemetry/device-status.vo';

// note: this layer validates SHAPE (is it a number, is it a parseable date, is it a known status);
// the value objects own the business RANGES. Repeating "0-100" here as well would put the same rule
// in two files that can drift apart — and the range belongs to the domain, not to HTTP. The status
// enum is the one thing checked twice, and only because both checks read the same enum constant, so
// they cannot disagree; it earns its place by documenting the allowed values in Swagger.
// No `deviceId` field: the device comes from the URL and the owner from the JWT.
export class RecordTelemetryRequestDto {
    @ApiProperty({
        description: 'Battery charge remaining, as a whole percentage',
        example: 87,
    })
    @IsInt()
    battery: number;

    @ApiProperty({
        description: 'Temperature reading in degrees Celsius',
        example: 21.5,
    })
    @IsNumber()
    temperature: number;

    @ApiProperty({ description: 'Latitude of the reading', example: 30.0444 })
    @IsNumber()
    lat: number;

    @ApiProperty({ description: 'Longitude of the reading', example: 31.2357 })
    @IsNumber()
    lng: number;

    @ApiProperty({
        description: 'Reported device status',
        enum: DeviceStatusValue,
        example: DeviceStatusValue.ONLINE,
    })
    @IsEnum(DeviceStatusValue)
    status: DeviceStatusValue;

    @ApiProperty({
        description: 'When the reading was taken on the device (ISO 8601)',
        example: '2026-07-23T09:15:00.000Z',
    })
    @Type(() => Date)
    @IsDate()
    timestamp: Date;
}
