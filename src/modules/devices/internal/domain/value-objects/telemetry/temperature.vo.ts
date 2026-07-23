// cypod-telemetry
import { ValueObject } from 'src/shared/domain/value-objects/value-object';
import { ValueValidator } from 'src/shared/domain/value-objects/value-validator';
import {
    InvalidTemperatureError,
    TemperatureOutOfRangeError,
} from '../../errors/telemetry/temperature.error';

// note: the bounds here are PHYSICAL plausibility (absolute zero to an upper sanity limit), not the
// alert threshold. A reading of 300C is a valid reading that should be stored and alerted on — it is
// not a malformed payload. Confusing the two would silently drop exactly the readings that matter.
export class Temperature extends ValueObject<number> {
    public static readonly MIN_CELSIUS = -273.15;
    public static readonly MAX_CELSIUS = 1000;

    private constructor(value: number) {
        super(value);
    }

    public static of(celsius: number): Temperature {
        this.validate(celsius);
        return new Temperature(celsius);
    }

    private static validate(celsius: number): void {
        if (!ValueValidator.isFiniteNumber(celsius)) {
            throw new InvalidTemperatureError();
        }

        if (
            !ValueValidator.isNumberInRange(
                celsius,
                this.MIN_CELSIUS,
                this.MAX_CELSIUS,
            )
        ) {
            throw new TemperatureOutOfRangeError(
                this.MIN_CELSIUS,
                this.MAX_CELSIUS,
            );
        }
    }

    public isAbove(threshold: number): boolean {
        return this._value > threshold;
    }
}
