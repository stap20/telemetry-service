// cypod-telemetry
// src/modules/devices/internal/application/queries/get-latest-device-state/get-latest-device-state.response.ts

// note: named for the cache outcome rather than for Redis, because "did we already know this"
// is a property of the read, not of whatever happens to be storing it. Swapping the cache backend
// must not change this vocabulary.
export enum CacheOutcome {
    HIT = 'HIT',
    MISS = 'MISS',
}

export class GetLatestDeviceStateResponse {
    constructor(
        public readonly deviceId: string,
        public readonly battery: number,
        public readonly temperature: number,
        public readonly lat: number | null,
        public readonly lng: number | null,
        public readonly status: string,
        public readonly recordedAt: Date,
        // note: carried on the response, not just logged, so the controller can surface it as a
        // response header. It stays out of the JSON body: the body is the device's state, and
        // where we found that state is metadata about the request, not part of the resource.
        public readonly cacheOutcome: CacheOutcome,
    ) {}
}
