// cypod-telemetry
// src/modules/devices/internal/application/queries/get-device-history/get-device-history.response.ts
export class TelemetryReadingResponse {
    constructor(
        public readonly id: string,
        public readonly deviceId: string,
        public readonly battery: number,
        public readonly temperature: number,
        public readonly lat: number,
        public readonly lng: number,
        public readonly status: string,
        public readonly recordedAt: Date,
    ) {}
}
