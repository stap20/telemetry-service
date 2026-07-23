// cypod-telemetry
// src/modules/devices/internal/infrastructure/database/entities/alert.entity.ts
export class AlertEntity {
    id: string;
    deviceId: string;
    type: string;
    message: string;
    value: number;
    threshold: number;
    triggeredAt: Date;
    resolvedAt: Date | null;
    createdAt: Date;

    constructor(data: Partial<AlertEntity>) {
        Object.assign(this, data);
    }
}
