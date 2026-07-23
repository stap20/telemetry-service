// cypod-telemetry
// src/modules/devices/internal/domain/entities/telemetry-reading.spec.ts
import { TelemetryReading } from './telemetry-reading.aggregate';
import { TelemetryThresholds } from '../value-objects/telemetry/telemetry-thresholds.vo';
import { TelemetryThresholdBreachedEvent } from '../events/telemetry-threshold-breached.event';
import { TelemetryThresholdClearedEvent } from '../events/telemetry-threshold-cleared.event';
import { AlertTypeValue } from '../value-objects/alert/alert-type.vo';
import { DeviceStatusValue } from '../value-objects/telemetry/device-status.vo';

// WHY THIS TEST: "active alerts" only means anything because every reading reaches a verdict on
// every rule — a healthy value is not silence, it is what closes an alert. The obvious optimisation
// is to emit events only when a threshold is breached, which looks harmless, passes any test that
// only checks alerting, and quietly makes alerts permanent so GET /alerts grows for ever.

const thresholds = TelemetryThresholds.of(15, 60);

const reading = (battery: number, temperature: number): TelemetryReading =>
    TelemetryReading.record(
        {
            id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
            deviceId: 'DEV-1001',
            battery,
            temperature,
            lat: 30.0444,
            lng: 31.2357,
            status: DeviceStatusValue.OK,
            recordedAt: new Date('2026-07-10T07:00:00Z'),
        },
        thresholds,
    );

const verdictFor = (
    events: readonly object[],
    type: AlertTypeValue,
): object | undefined =>
    events.find((event) => (event as { alertType: AlertTypeValue }).alertType === type);

describe('TelemetryReading', () => {
    it('reaches a verdict on every rule, not only on the ones that breached', () => {
        const events = reading(90, 20).getDomainEventsToPublish();

        expect(events).toHaveLength(2);
        expect(
            verdictFor(events, AlertTypeValue.LOW_BATTERY),
        ).toBeInstanceOf(TelemetryThresholdClearedEvent);
        expect(
            verdictFor(events, AlertTypeValue.HIGH_TEMPERATURE),
        ).toBeInstanceOf(TelemetryThresholdClearedEvent);
    });

    it('breaches one rule without silencing the other', () => {
        // note: low battery AND an acceptable temperature. The battery must raise an alert while
        // the temperature independently CLEARS one — a reading is not simply "good" or "bad".
        const events = reading(4, 20).getDomainEventsToPublish();

        expect(
            verdictFor(events, AlertTypeValue.LOW_BATTERY),
        ).toBeInstanceOf(TelemetryThresholdBreachedEvent);
        expect(
            verdictFor(events, AlertTypeValue.HIGH_TEMPERATURE),
        ).toBeInstanceOf(TelemetryThresholdClearedEvent);
    });

    it('breaches both rules at once when both are exceeded', () => {
        const events = reading(4, 90).getDomainEventsToPublish();

        expect(events).toHaveLength(2);
        expect(
            events.every((e) => e instanceof TelemetryThresholdBreachedEvent),
        ).toBe(true);
    });

    it('stamps the verdict with the reading time, never with now()', () => {
        // note: this is what makes out-of-order replay safe. An alert is only closed by a reading
        // taken AFTER it was raised, and that comparison is worthless if the event carries the
        // moment we processed it instead of the moment the device measured it.
        const events = reading(90, 20).getDomainEventsToPublish();

        expect((events[0] as TelemetryThresholdClearedEvent).recordedAt).toEqual(
            new Date('2026-07-10T07:00:00Z'),
        );
    });
});
