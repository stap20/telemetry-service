// cypod-telemetry
import { ValueObject } from 'src/shared/domain/value-objects/value-object';
import { InvalidAlertTypeError } from '../../errors/alert/alert.error';

export enum AlertTypeValue {
    LOW_BATTERY = 'LOW_BATTERY',
    HIGH_TEMPERATURE = 'HIGH_TEMPERATURE',
}

// note: the alert type names WHICH rule was broken, so it is a closed set that maps 1:1 to the
// threshold checks on the reading. Adding a new threshold means adding a value here — the compiler
// then points at every place that must handle it.
export class AlertType extends ValueObject<AlertTypeValue> {
    private constructor(value: AlertTypeValue) {
        super(value);
    }

    public static of(type: string): AlertType {
        this.validate(type);
        return new AlertType(type as AlertTypeValue);
    }

    private static validate(type: string): void {
        if (!this.allowedValues().includes(type)) {
            throw new InvalidAlertTypeError(this.allowedValues().join(', '));
        }
    }

    private static allowedValues(): string[] {
        return Object.values(AlertTypeValue);
    }
}
