// cypod-telemetry
// src/modules/devices/internal/presentation/dtos/responses/active-alert.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ActiveAlertResponseDto {
    @ApiProperty({ description: 'Identifier of the alert', format: 'uuid' })
    id: string;

    @ApiProperty({ description: 'Device the alert was raised against', example: 'sensor-A1B2C3' })
    deviceId: string;

    @ApiProperty({ description: 'Name of that device', example: 'Warehouse Freezer' })
    deviceName: string;

    @ApiProperty({
        description: 'Which threshold was crossed',
        example: 'LOW_BATTERY',
        enum: ['LOW_BATTERY', 'HIGH_TEMPERATURE'],
    })
    type: string;

    @ApiProperty({
        description: 'What happened, in words',
        example: 'Battery level 5% dropped below the 15% threshold',
    })
    message: string;

    @ApiProperty({ description: 'The reading that breached', example: 5 })
    value: number;

    @ApiProperty({ description: 'The limit it crossed', example: 15 })
    threshold: number;

    @ApiProperty({
        description: 'When the breaching reading was taken',
        example: '2026-07-23T10:15:00.000Z',
    })
    triggeredAt: Date;

    constructor(
        id: string,
        deviceId: string,
        deviceName: string,
        type: string,
        message: string,
        value: number,
        threshold: number,
        triggeredAt: Date,
    ) {
        this.id = id;
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.type = type;
        this.message = message;
        this.value = value;
        this.threshold = threshold;
        this.triggeredAt = triggeredAt;
    }
}
