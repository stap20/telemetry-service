// cypod-telemetry
import { TelemetryReading } from '../entities/telemetry-reading.aggregate';

export enum TelemetryWriteOutcome {
    STORED = 'STORED',
    DUPLICATE = 'DUPLICATE',
}

// note: the id is returned rather than assumed. On the duplicate path the id we minted was never
// written, so echoing it back would hand the caller an identifier for a row that does not exist —
// the id here is always the one that is actually in the table.
export interface TelemetryWriteResult {
    id: string;
    outcome: TelemetryWriteOutcome;
}

// note: generateId() is present here (unlike IDeviceRepository) because a reading has no external
// identity — the server mints it. No getById: readings are append-only and nothing in this feature
// reads one back by id, so the write side stays as small as the use-case actually needs.
// save() reports an OUTCOME instead of returning void because storing a reading and recognising one
// we already have are different events in the world, and only the caller can decide what each means.
export interface ITelemetryEventRepository {
    generateId(): string;
    save(reading: TelemetryReading): Promise<TelemetryWriteResult>;
}

export const ITelemetryEventRepository = Symbol('ITelemetryEventRepository');
