// cypod-telemetry
// note: `duplicate` is reported rather than hidden. The call succeeded either way — that is what
// makes ingestion idempotent and safe for a device to retry — but a client replaying a batch it has
// already sent deserves to know nothing new was stored, and an operator counting rows deserves to
// know why the total is lower than the number of requests.
export class RecordTelemetryResponse {
    constructor(
        public readonly id: string,
        public readonly deviceId: string,
        public readonly recordedAt: Date,
        public readonly alertsRaised: number,
        public readonly duplicate: boolean,
    ) {}
}
