// cypod-telemetry
// src/modules/devices/internal/presentation/dtos/responses/telemetry-recorded.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TelemetryRecordedResponseDto {
    @ApiProperty({
        description: 'Identifier of the stored telemetry event',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        format: 'uuid',
    })
    id: string;

    @ApiProperty({
        description: 'The device the reading belongs to',
        example: 'sensor-A1B2C3',
    })
    deviceId: string;

    @ApiProperty({
        description: 'When the reading was taken on the device',
        example: '2026-07-23T09:15:00.000Z',
    })
    recordedAt: Date;

    // note: echoed back so the caller knows the reading tripped a threshold without having to poll
    // for alerts — useful for a device that may want to change its own reporting behaviour.
    @ApiProperty({
        description: 'How many alert thresholds this reading breached',
        example: 1,
    })
    alertsRaised: number;

    // note: true when this exact reading was already stored. Reported as a field on a 200 rather
    // than as a 409, because from the device's point of view nothing went wrong — it asked us to
    // record a reading and that reading is recorded. An error status would push a retrying device
    // into treating a success as a failure and retrying harder.
    @ApiProperty({
        description:
            'Whether this reading was already stored and was therefore ignored',
        example: false,
    })
    duplicate: boolean;

    constructor(
        id: string,
        deviceId: string,
        recordedAt: Date,
        alertsRaised: number,
        duplicate: boolean,
    ) {
        this.id = id;
        this.deviceId = deviceId;
        this.recordedAt = recordedAt;
        this.alertsRaised = alertsRaised;
        this.duplicate = duplicate;
    }
}
