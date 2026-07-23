// cypod-telemetry
// src/modules/devices/internal/domain/entities/alert.aggregate.ts
import { AggregateRoot } from 'src/shared/domain/aggregate-root';
import { DeviceId } from '../value-objects/device-id.vo';
import { AlertId } from '../value-objects/alert/alert-id.vo';
import { AlertType, AlertTypeValue } from '../value-objects/alert/alert-type.vo';

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
}

export class Alert extends AggregateRoot<AlertId> {
    private deviceId: DeviceId;
    private type: AlertType;
    private message: string;
    private value: number;
    private threshold: number;
    private triggeredAt: Date;

    private constructor(
        id: AlertId,
        deviceId: DeviceId,
        type: AlertType,
        message: string,
        value: number,
        threshold: number,
        triggeredAt: Date,
    ) {
        super(id);
        this.deviceId = deviceId;
        this.type = type;
        this.message = message;
        this.value = value;
        this.threshold = threshold;
        this.triggeredAt = triggeredAt;
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
        );
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

    public equals(other: Alert): boolean {
        if (!(other instanceof Alert)) {
            return false;
        }
        return this.id.equals(other.id);
    }
}
