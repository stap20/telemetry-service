// cypod-telemetry
import { DomainEvent } from 'src/shared/domain/events/domain-event';
import { AlertTypeValue } from '../value-objects/alert/alert-type.vo';

// note: the mirror of TelemetryThresholdBreachedEvent — "this rule is satisfied again". It carries
// no value or threshold because nothing was crossed; the only facts that matter downstream are
// which rule recovered and when. Emitting recovery as its own event, rather than having the alert
// handler infer it from the absence of a breach, keeps the reading aggregate the single place that
// knows what a threshold means: the handlers only react to verdicts it has already reached.
export class TelemetryThresholdClearedEvent extends DomainEvent {
    constructor(
        public readonly deviceId: string,
        public readonly alertType: AlertTypeValue,
        public readonly recordedAt: Date,
    ) {
        super();
    }
}
