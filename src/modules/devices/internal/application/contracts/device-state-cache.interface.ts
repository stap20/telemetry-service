// cypod-telemetry
// src/modules/devices/internal/application/contracts/device-state-cache.interface.ts
export interface LatestDeviceState {
    deviceId: string;
    battery: number;
    temperature: number;
    lat: number;
    lng: number;
    status: string;
    recordedAt: string;
}

// note: the application asks for "remember this device's latest state" and says nothing about
// Redis, key naming or expiry — those are infrastructure policy and live in the implementation.
// The handler therefore has no reason to change if the cache backend or the TTL does.
export interface IDeviceStateCache {
    saveLatest(state: LatestDeviceState): Promise<void>;
}

export const IDeviceStateCache = Symbol('IDeviceStateCache');
