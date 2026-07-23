// cypod-telemetry
import { ValueObject } from 'src/shared/domain/value-objects/value-object';
import { ValueValidator } from 'src/shared/domain/value-objects/value-validator';
import {
    InvalidBatteryLevelError,
    BatteryLevelOutOfRangeError,
} from '../../errors/telemetry/battery-level.error';

// note: fractional percentages are accepted. This VO originally demanded a whole number, which was
// an assumption about hardware rather than an observation of it — 471 of the 528 readings in the
// sample data report a tenth of a percent (27.7, 76.9). Rounding them at the edge would have thrown
// away real precision to satisfy a constraint nothing asked for, so the constraint went instead.
export class BatteryLevel extends ValueObject<number> {
    public static readonly MIN_PERCENT = 0;
    public static readonly MAX_PERCENT = 100;

    private constructor(value: number) {
        super(value);
    }

    public static of(percent: number): BatteryLevel {
        this.validate(percent);
        return new BatteryLevel(percent);
    }

    private static validate(percent: number): void {
        if (!ValueValidator.isFiniteNumber(percent)) {
            throw new InvalidBatteryLevelError();
        }

        if (
            !ValueValidator.isNumberInRange(
                percent,
                this.MIN_PERCENT,
                this.MAX_PERCENT,
            )
        ) {
            throw new BatteryLevelOutOfRangeError(
                this.MIN_PERCENT,
                this.MAX_PERCENT,
            );
        }
    }

    public isBelow(threshold: number): boolean {
        return this._value < threshold;
    }
}
