// cypod-telemetry
import { ValueObject } from 'src/shared/domain/value-objects/value-object';
import { ValueValidator } from 'src/shared/domain/value-objects/value-validator';
import {
    InvalidBatteryThresholdError,
    InvalidTemperatureThresholdError,
} from '../../errors/telemetry/telemetry-thresholds.error';
import { BatteryLevel } from './battery-level.vo';
import { Temperature } from './temperature.vo';

export interface TelemetryThresholdsValue {
    minBattery: number;
    maxTemperature: number;
}

// note: the alerting limits are a domain concept, not a config detail, so they are modelled as a VO
// and validated on the way in. Infrastructure reads the env vars; the domain still decides what a
// legal threshold is. This is what keeps `evaluate` on the aggregate pure and unit-testable.
export class TelemetryThresholds extends ValueObject<TelemetryThresholdsValue> {
    private constructor(value: TelemetryThresholdsValue) {
        super(value);
    }

    public static of(
        minBattery: number,
        maxTemperature: number,
    ): TelemetryThresholds {
        this.validateBattery(minBattery);
        this.validateTemperature(maxTemperature);

        return new TelemetryThresholds({ minBattery, maxTemperature });
    }

    private static validateBattery(minBattery: number): void {
        if (
            !ValueValidator.isFiniteNumber(minBattery) ||
            !ValueValidator.isNumberInRange(
                minBattery,
                BatteryLevel.MIN_PERCENT,
                BatteryLevel.MAX_PERCENT,
            )
        ) {
            throw new InvalidBatteryThresholdError(
                BatteryLevel.MIN_PERCENT,
                BatteryLevel.MAX_PERCENT,
            );
        }
    }

    private static validateTemperature(maxTemperature: number): void {
        if (
            !ValueValidator.isFiniteNumber(maxTemperature) ||
            !ValueValidator.isNumberInRange(
                maxTemperature,
                Temperature.MIN_CELSIUS,
                Temperature.MAX_CELSIUS,
            )
        ) {
            throw new InvalidTemperatureThresholdError(
                Temperature.MIN_CELSIUS,
                Temperature.MAX_CELSIUS,
            );
        }
    }

    public get minBattery(): number {
        return this._value.minBattery;
    }

    public get maxTemperature(): number {
        return this._value.maxTemperature;
    }
}
