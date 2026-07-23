// cypod-telemetry
// src/modules/devices/internal/application/contracts/telemetry-thresholds.provider.interface.ts
import { TelemetryThresholds } from '../../domain/value-objects/telemetry/telemetry-thresholds.vo';

// note: the handler needs the current alerting limits but must not read environment variables
// itself — that would drag configuration into the application layer and make the use-case
// untestable without an env. Infrastructure reads the config and hands back a validated VO.
export interface ITelemetryThresholdsProvider {
    current(): TelemetryThresholds;
}

export const ITelemetryThresholdsProvider = Symbol(
    'ITelemetryThresholdsProvider',
);
