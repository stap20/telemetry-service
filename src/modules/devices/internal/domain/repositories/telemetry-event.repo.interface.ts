// cypod-telemetry
import { TelemetryReading } from '../entities/telemetry-reading.aggregate';

// note: generateId() is present here (unlike IDeviceRepository) because a reading has no external
// identity — the server mints it. No getById: readings are append-only and nothing in this feature
// reads one back by id, so the write side stays as small as the use-case actually needs.
export interface ITelemetryEventRepository {
    generateId(): string;
    save(reading: TelemetryReading): Promise<void>;
}

export const ITelemetryEventRepository = Symbol('ITelemetryEventRepository');
