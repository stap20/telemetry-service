// cypod-telemetry
// src/modules/devices/internal/presentation/dtos/responses/telemetry-reading.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TelemetryReadingResponseDto {
    @ApiProperty({ description: 'Identifier of the stored reading', format: 'uuid' })
    id: string;

    @ApiProperty({ description: 'The device that reported it', example: 'sensor-A1B2C3' })
    deviceId: string;

    @ApiProperty({ description: 'Battery level in percent', example: 82 })
    battery: number;

    @ApiProperty({ description: 'Temperature in degrees Celsius', example: 21.4 })
    temperature: number;

    @ApiProperty({ description: 'Latitude at the time of the reading', example: 30.0444 })
    lat: number;

    @ApiProperty({ description: 'Longitude at the time of the reading', example: 31.2357 })
    lng: number;

    @ApiProperty({ description: 'Status the device reported', example: 'ONLINE' })
    status: string;

    @ApiProperty({
        description: 'When the device took the reading',
        example: '2026-07-23T10:15:00.000Z',
    })
    recordedAt: Date;

    constructor(
        id: string,
        deviceId: string,
        battery: number,
        temperature: number,
        lat: number,
        lng: number,
        status: string,
        recordedAt: Date,
    ) {
        this.id = id;
        this.deviceId = deviceId;
        this.battery = battery;
        this.temperature = temperature;
        this.lat = lat;
        this.lng = lng;
        this.status = status;
        this.recordedAt = recordedAt;
    }
}

export class DeviceHistoryResponseDto {
    @ApiProperty({
        description: 'The requested page of readings, newest first',
        type: TelemetryReadingResponseDto,
        isArray: true,
    })
    items: TelemetryReadingResponseDto[];

    @ApiProperty({
        description: 'Total readings matching the filter, across all pages',
        example: 1432,
    })
    total: number;

    @ApiProperty({ description: 'Readings skipped', example: 0 })
    offset: number;

    @ApiProperty({ description: 'Page size used', example: 20 })
    limit: number;

    constructor(
        items: TelemetryReadingResponseDto[],
        total: number,
        offset: number,
        limit: number,
    ) {
        this.items = items;
        this.total = total;
        this.offset = offset;
        this.limit = limit;
    }
}
