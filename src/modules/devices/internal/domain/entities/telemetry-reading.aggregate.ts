// cypod-telemetry
// src/modules/devices/internal/domain/entities/telemetry-reading.aggregate.ts
import { AggregateRoot } from 'src/shared/domain/aggregate-root';
import { DeviceId } from '../value-objects/device-id.vo';
import { TelemetryEventId } from '../value-objects/telemetry/telemetry-event-id.vo';
import { BatteryLevel } from '../value-objects/telemetry/battery-level.vo';
import { Temperature } from '../value-objects/telemetry/temperature.vo';
import { GeoCoordinates } from '../value-objects/telemetry/geo-coordinates.vo';
import {
    DeviceStatus,
    DeviceStatusValue,
} from '../value-objects/telemetry/device-status.vo';
import { PartialGeoCoordinatesError } from '../errors/telemetry/geo-coordinates.error';
import { TelemetryTimestamp } from '../value-objects/telemetry/telemetry-timestamp.vo';
import { TelemetryThresholds } from '../value-objects/telemetry/telemetry-thresholds.vo';
import { AlertTypeValue } from '../value-objects/alert/alert-type.vo';
import { TelemetryThresholdBreachedEvent } from '../events/telemetry-threshold-breached.event';
import { TelemetryThresholdClearedEvent } from '../events/telemetry-threshold-cleared.event';

// note: lat/lng and status are nullable because a reading can be partial without being wrong. A
// device indoors or under a bridge has no GPS fix, and a firmware build that omits `status` still
// reports a perfectly good battery and temperature — which are the two fields the alerting rules
// actually run on. Rejecting the whole payload over a missing position would drop exactly the
// readings taken in the places where a device is most likely to be in trouble.
export interface RecordTelemetryParams {
    id: string;
    deviceId: string;
    battery: number;
    temperature: number;
    lat: number | null;
    lng: number | null;
    status: string | null;
    recordedAt: Date;
}

// note: identical shape to the record params today, but named separately because the two have
// different reasons to change — reconstruction must keep accepting whatever was ever persisted,
// while the record params follow the current incoming contract.
export type TelemetryReadingPersistenceParams = RecordTelemetryParams;

export class TelemetryReading extends AggregateRoot<TelemetryEventId> {
    private deviceId: DeviceId;
    private battery: BatteryLevel;
    private temperature: Temperature;
    private location: GeoCoordinates | null;
    private status: DeviceStatus;
    private recordedAt: TelemetryTimestamp;

    private constructor(
        id: TelemetryEventId,
        deviceId: DeviceId,
        battery: BatteryLevel,
        temperature: Temperature,
        location: GeoCoordinates | null,
        status: DeviceStatus,
        recordedAt: TelemetryTimestamp,
    ) {
        super(id);
        this.deviceId = deviceId;
        this.battery = battery;
        this.temperature = temperature;
        this.location = location;
        this.status = status;
        this.recordedAt = recordedAt;
    }

    // note: recording a reading and judging it against the thresholds are ONE business action, so
    // they are one factory. Splitting them into `record()` + a separately-callable `evaluate()`
    // would let a caller persist a reading and forget to check it — the exact bug that makes an
    // alerting system quietly useless. Thresholds are passed in (not read from config here) so the
    // domain stays free of infrastructure and this rule is testable with plain values.
    public static record(
        params: RecordTelemetryParams,
        thresholds: TelemetryThresholds,
    ): TelemetryReading {
        const reading = new TelemetryReading(
            TelemetryEventId.create(params.id),
            DeviceId.create(params.deviceId),
            BatteryLevel.of(params.battery),
            Temperature.of(params.temperature),
            TelemetryReading.locationFrom(params.lat, params.lng),
            DeviceStatus.of(params.status ?? DeviceStatusValue.UNKNOWN),
            TelemetryTimestamp.of(params.recordedAt),
        );

        reading.evaluateAgainst(thresholds);

        return reading;
    }

    public static fromPersistence(
        params: TelemetryReadingPersistenceParams,
    ): TelemetryReading {
        return new TelemetryReading(
            TelemetryEventId.create(params.id),
            DeviceId.create(params.deviceId),
            BatteryLevel.of(params.battery),
            Temperature.of(params.temperature),
            TelemetryReading.locationFrom(params.lat, params.lng),
            DeviceStatus.of(params.status ?? DeviceStatusValue.UNKNOWN),
            TelemetryTimestamp.of(params.recordedAt),
        );
    }

    // note: "no fix" and "half a fix" are different things and only one of them is acceptable. Both
    // coordinates absent is a device that could not see the sky; one absent is a payload that lost a
    // field in transit, and the GeoCoordinates VO stays all-or-nothing so a half-position can never
    // be constructed at all.
    private static locationFrom(
        lat: number | null,
        lng: number | null,
    ): GeoCoordinates | null {
        const hasLatitude = lat !== null && lat !== undefined;
        const hasLongitude = lng !== null && lng !== undefined;

        if (!hasLatitude && !hasLongitude) {
            return null;
        }

        if (!hasLatitude || !hasLongitude) {
            throw new PartialGeoCoordinatesError();
        }

        return GeoCoordinates.of(lat, lng);
    }

    // note: both thresholds are checked independently — one reading can breach battery AND
    // temperature at once, and each raises its own alert rather than the first one masking the other.
    // Every reading reaches a verdict on every rule: a healthy value is not silence, it is a
    // positive "this rule is satisfied" that closes any alert still open against it. Without the
    // cleared branch an alert could only ever be raised, so "active alerts" would grow forever and
    // stop meaning anything.
    private evaluateAgainst(thresholds: TelemetryThresholds): void {
        this.judge(
            this.battery.isBelow(thresholds.minBattery),
            AlertTypeValue.LOW_BATTERY,
            this.battery.value,
            thresholds.minBattery,
        );

        this.judge(
            this.temperature.isAbove(thresholds.maxTemperature),
            AlertTypeValue.HIGH_TEMPERATURE,
            this.temperature.value,
            thresholds.maxTemperature,
        );
    }

    private judge(
        breached: boolean,
        type: AlertTypeValue,
        value: number,
        threshold: number,
    ): void {
        this.addDomainEvent(
            breached
                ? new TelemetryThresholdBreachedEvent(
                      this.deviceId.value,
                      type,
                      value,
                      threshold,
                      this.recordedAt.value,
                  )
                : new TelemetryThresholdClearedEvent(
                      this.deviceId.value,
                      type,
                      this.recordedAt.value,
                  ),
        );
    }

    public getDeviceId(): DeviceId {
        return this.deviceId;
    }

    public getBattery(): BatteryLevel {
        return this.battery;
    }

    public getTemperature(): Temperature {
        return this.temperature;
    }

    public getLocation(): GeoCoordinates | null {
        return this.location;
    }

    public getStatus(): DeviceStatus {
        return this.status;
    }

    public getRecordedAt(): TelemetryTimestamp {
        return this.recordedAt;
    }

    public equals(other: TelemetryReading): boolean {
        if (!(other instanceof TelemetryReading)) {
            return false;
        }
        return this.id.equals(other.id);
    }
}
