// cypod-telemetry
// src/modules/devices/internal/presentation/dtos/responses/device.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class DeviceResponseDto {
    @ApiProperty({
        description: "The device's stable identifier",
        example: 'sensor-A1B2C3',
    })
    id: string;

    @ApiProperty({
        description: 'Human-friendly device name',
        example: 'Living Room Temperature Sensor',
    })
    name: string;

    @ApiProperty({
        description: 'Id of the user who owns the device',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        format: 'uuid',
    })
    ownerId: string;

    constructor(id: string, name: string, ownerId: string) {
        this.id = id;
        this.name = name;
        this.ownerId = ownerId;
    }
}
