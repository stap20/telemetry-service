// cypod-telemetry
// src/modules/devices/internal/infrastructure/database/entities/telemetry-event.entity.ts
export class TelemetryEventEntity {
    id: string;
    deviceId: string;
    battery: number;
    temperature: number;
    lat: number;
    lng: number;
    status: string;
    recordedAt: Date;
    createdAt: Date;

    constructor(data: Partial<TelemetryEventEntity>) {
        Object.assign(this, data);
    }
}
