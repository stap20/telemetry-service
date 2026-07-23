// cypod-telemetry
import { DomainError } from 'src/shared/domain/errors/domain.error';

// note: thresholds come from configuration, so they are validated as a value object like any other
// input. A typo in an env var (a max temperature of "abc", a battery floor of 500) fails loudly at
// the point of use instead of silently disabling alerting for the whole fleet.
export class InvalidBatteryThresholdError extends DomainError {
    constructor(min: number, max: number) {
        super(
            `Battery alert threshold must be between ${min} and ${max}`,
            'devices.battery_threshold_invalid',
            { min, max },
        );
    }
}

export class InvalidTemperatureThresholdError extends DomainError {
    constructor(min: number, max: number) {
        super(
            `Temperature alert threshold must be between ${min} and ${max}`,
            'devices.temperature_threshold_invalid',
            { min, max },
        );
    }
}
