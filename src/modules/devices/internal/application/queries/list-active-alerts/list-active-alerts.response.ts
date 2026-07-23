// cypod-telemetry
// src/modules/devices/internal/application/queries/list-active-alerts/list-active-alerts.response.ts
export class ActiveAlertResponse {
    constructor(
        public readonly id: string,
        public readonly deviceId: string,
        // note: the device name is carried alongside the id because an alerts list is read by a
        // person deciding what to go and fix. "sensor-A1B2C3 battery low" makes them look the id
        // up somewhere else; CQRS exists precisely so a read model can answer the whole question
        // in one response instead of matching the write model's shape.
        public readonly deviceName: string,
        public readonly type: string,
        public readonly message: string,
        public readonly value: number,
        public readonly threshold: number,
        public readonly triggeredAt: Date,
    ) {}
}
