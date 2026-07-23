// cypod-telemetry
// src/modules/devices/internal/infrastructure/services/telemetry-thresholds.provider.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ITelemetryThresholdsProvider } from '../../application/contracts/telemetry-thresholds.provider.interface';
import { TelemetryThresholds } from '../../domain/value-objects/telemetry/telemetry-thresholds.vo';

@Injectable()
export class TelemetryThresholdsProvider implements ITelemetryThresholdsProvider {
    // note: the task names 15% battery explicitly and asks for the temperature maximum to be
    // configurable; both are configurable here for symmetry, with the task's value as the default.
    private static readonly DEFAULT_MIN_BATTERY = 15;
    private static readonly DEFAULT_MAX_TEMPERATURE = 60;

    constructor(private readonly configService: ConfigService) {}

    // note: read per call rather than cached in a field so a threshold change takes effect on the
    // next reading. The VO re-validates every time, so a bad value can never reach the evaluation.
    current(): TelemetryThresholds {
        return TelemetryThresholds.of(
            this.numberOrDefault(
                'TELEMETRY_MIN_BATTERY',
                TelemetryThresholdsProvider.DEFAULT_MIN_BATTERY,
            ),
            this.numberOrDefault(
                'TELEMETRY_MAX_TEMPERATURE',
                TelemetryThresholdsProvider.DEFAULT_MAX_TEMPERATURE,
            ),
        );
    }

    // note: env vars arrive as strings; Number('') is 0, which would silently mean "never alert on
    // battery". Anything not parseable falls back to the default instead.
    private numberOrDefault(key: string, fallback: number): number {
        const raw = this.configService.get<string>(key);

        if (raw === undefined || raw === null || `${raw}`.trim() === '') {
            return fallback;
        }

        const parsed = Number(raw);

        return Number.isFinite(parsed) ? parsed : fallback;
    }
}
