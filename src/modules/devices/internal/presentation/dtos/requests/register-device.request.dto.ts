// cypod-telemetry
// src/modules/devices/internal/presentation/dtos/requests/register-device.request.dto.ts
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// note: there is deliberately NO `owner` field here. The spec lists (id, name, owner), but ownership
// is taken from the authenticated user (@CurrentUser), never from the body — otherwise a caller could
// register a device under someone else's account. id/name are the only client-supplied inputs.
export class RegisterDeviceRequestDto {
    @ApiProperty({
        description: "The device's own stable identifier (hardware/serial id)",
        example: 'sensor-A1B2C3',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    id: string;

    @ApiProperty({
        description: 'Human-friendly device name',
        example: 'Living Room Temperature Sensor',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;
}
