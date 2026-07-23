// cypod-telemetry
// src/modules/devices/internal/domain/entities/alert.aggregate.ts
import { AggregateRoot } from 'src/shared/domain/aggregate-root';
import { DeviceId } from '../value-objects/device-id.vo';
import { AlertId } from '../value-objects/alert/alert-id.vo';
import { AlertType, AlertTypeValue } from '../value-objects/alert/alert-type.vo';
import { AlertAlreadyResolvedError } from '../errors/alert/alert.error';

export interface RaiseAlertParams {
    id: string;
    deviceId: string;
    type: string;
    value: number;
    threshold: number;
    triggeredAt: Date;
}

export interface AlertPersistenceParams extends RaiseAlertParams {
    message: string;
    resolvedAt: Date | null;
}

export class Alert extends AggregateRoot<AlertId> {
    private deviceId: DeviceId;
    private type: AlertType;
    private message: string;
    private value: number;
    private threshold: number;
    private triggeredAt: Date;
    private resolvedAt: Date | null;

    private constructor(
        id: AlertId,
        deviceId: DeviceId,
        type: AlertType,
        message: string,
        value: number,
        threshold: number,
        triggeredAt: Date,
        resolvedAt: Date | null,
    ) {
        super(id);
        this.deviceId = deviceId;
        this.type = type;
        this.message = message;
        this.value = value;
        this.threshold = threshold;
        this.triggeredAt = triggeredAt;
        this.resolvedAt = resolvedAt;
    }

    // note: `raise` derives its own message rather than accepting one — the alert owns how it
    // describes itself, so the wording cannot drift between callers. The stored sentence is the
    // English audit record; anything shown to a user is localised at the HTTP edge like every other
    // message in this codebase.
    public static raise(params: RaiseAlertParams): Alert {
        const type = AlertType.of(params.type);

        return new Alert(
            AlertId.create(params.id),
            DeviceId.create(params.deviceId),
            type,
            this.describe(type, params.value, params.threshold),
            params.value,
            params.threshold,
            params.triggeredAt,
            null,
        );
    }

    public static fromPersistence(params: AlertPersistenceParams): Alert {
        return new Alert(
            AlertId.create(params.id),
            DeviceId.create(params.deviceId),
            AlertType.of(params.type),
            params.message,
            params.value,
            params.threshold,
            params.triggeredAt,
            params.resolvedAt,
        );
    }

    // note: an alert is closed by the world getting better, not by a person acknowledging it — the
    // next reading that no longer breaches this threshold is what resolves it. That is why there is
    // no `acknowledge()` and no dismiss endpoint: a human dismissing a still-breaching condition
    // would hide a live problem, and a condition that has genuinely recovered should not wait on
    // someone to notice. `clearedAt` is the reading's own timestamp, not now(), so the recorded
    // duration reflects when the device actually recovered rather than when we got around to it.
    public resolve(clearedAt: Date): void {
        if (this.resolvedAt !== null) {
            throw new AlertAlreadyResolvedError(this.id.value);
        }

        this.resolvedAt = clearedAt;
    }

    public isActive(): boolean {
        return this.resolvedAt === null;
    }

    private static describe(
        type: AlertType,
        value: number,
        threshold: number,
    ): string {
        if (type.value === AlertTypeValue.LOW_BATTERY) {
            return `Battery level ${value}% dropped below the ${threshold}% threshold`;
        }

        return `Temperature ${value}C rose above the ${threshold}C threshold`;
    }

    public getDeviceId(): DeviceId {
        return this.deviceId;
    }

    public getType(): AlertType {
        return this.type;
    }

    public getMessage(): string {
        return this.message;
    }

    public getValue(): number {
        return this.value;
    }

    public getThreshold(): number {
        return this.threshold;
    }

    public getTriggeredAt(): Date {
        return this.triggeredAt;
    }

    public getResolvedAt(): Date | null {
        return this.resolvedAt;
    }

    public equals(other: Alert): boolean {
        if (!(other instanceof Alert)) {
            return false;
        }
        return this.id.equals(other.id);
    }
}
