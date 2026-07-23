// cypod-telemetry
import { DomainEvent } from 'src/shared/domain/events/domain-event';
import { AlertTypeValue } from '../value-objects/alert/alert-type.vo';

// note: carries primitives only. The event crosses the bus (and could later cross a process or a
// queue), so it must survive serialisation — passing VOs or the aggregate itself would not. It
// records what breached, the offending value and the limit it crossed, which is everything the
// alert handler needs without re-reading the reading from the database.
export class TelemetryThresholdBreachedEvent extends DomainEvent {
    constructor(
        public readonly deviceId: string,
        public readonly alertType: AlertTypeValue,
        public readonly value: number,
        public readonly threshold: number,
        public readonly recordedAt: Date,
    ) {
        super();
    }
}
