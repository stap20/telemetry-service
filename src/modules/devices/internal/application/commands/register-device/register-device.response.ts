// cypod-telemetry
// src/modules/devices/internal/application/commands/register-device/register-device.response.ts
export class RegisterDeviceResponse {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly ownerId: string,
    ) {}
}
