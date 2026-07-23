// cypod-telemetry
// src/modules/devices/internal/application/queries/list-devices/list-devices.response.ts
export class ListDevicesResponse {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly ownerId: string,
    ) {}
}
