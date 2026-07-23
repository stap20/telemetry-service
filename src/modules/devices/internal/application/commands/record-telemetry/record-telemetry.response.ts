// cypod-telemetry
export class RecordTelemetryResponse {
    constructor(
        public readonly id: string,
        public readonly deviceId: string,
        public readonly recordedAt: Date,
        public readonly alertsRaised: number,
    ) {}
}
