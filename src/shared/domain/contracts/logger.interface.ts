// cypod-telemetry
// src/shared/domain/contracts/logger.interface.ts
export interface ILogger {
    info(message: string, context?: any): void;
    error(message: string, error?: Error, context?: any): void;
    warn(message: string, context?: any): void;
    debug(message: string, context?: any): void;
}
export const ILogger = Symbol('ILogger');
