// cypod-telemetry
// src/modules/devices/internal/presentation/dtos/responses/latest-device-state.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class LatestDeviceStateResponseDto {
    @ApiProperty({
        description: 'The device this state belongs to',
        example: 'sensor-A1B2C3',
    })
    deviceId: string;

    @ApiProperty({ description: 'Battery level in percent', example: 82 })
    battery: number;

    @ApiProperty({ description: 'Temperature in degrees Celsius', example: 21.4 })
    temperature: number;

    @ApiProperty({ description: 'Latitude of the last known position', example: 30.0444 })
    lat: number | null;

    @ApiProperty({ description: 'Longitude of the last known position', example: 31.2357 })
    lng: number | null;

    @ApiProperty({
        description: 'Status the device reported',
        example: 'ONLINE',
    })
    status: string;

    @ApiProperty({
        description: 'When the device took the reading',
        example: '2026-07-23T10:15:00.000Z',
    })
    recordedAt: Date;

    constructor(
        deviceId: string,
        battery: number,
        temperature: number,
        lat: number | null,
        lng: number | null,
        status: string,
        recordedAt: Date,
    ) {
        this.deviceId = deviceId;
        this.battery = battery;
        this.temperature = temperature;
        this.lat = lat;
        this.lng = lng;
        this.status = status;
        this.recordedAt = recordedAt;
    }
}
