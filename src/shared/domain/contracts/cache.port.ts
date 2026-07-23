// cypod-telemetry
// src/shared/domain/contracts/cache.port.ts
export interface ICachePort {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    delete(key: string): Promise<void>;
}
export const ICachePort = Symbol('ICachePort');
