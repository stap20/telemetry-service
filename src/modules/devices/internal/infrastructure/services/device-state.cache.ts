// cypod-telemetry
// src/modules/devices/internal/infrastructure/services/device-state.cache.ts
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ICachePort } from 'src/shared/domain/contracts/cache.port';
import {
    IDeviceStateCache,
    LatestDeviceState,
} from '../../application/contracts/device-state-cache.interface';

@Injectable()
export class DeviceStateCache implements IDeviceStateCache {
    // note: TTL is configurable but defaults here rather than being required — a missing env var
    // should not stop the service booting, it should fall back to a sane hour.
    private static readonly DEFAULT_TTL_SECONDS = 3600;
    private static readonly KEY_PREFIX = 'devices:latest-state';

    constructor(
        @Inject(ICachePort) private readonly cache: ICachePort,
        private readonly configService: ConfigService,
    ) {}

    async saveLatest(state: LatestDeviceState): Promise<void> {
        await this.cache.set(
            DeviceStateCache.keyFor(state.deviceId),
            state,
            this.ttlSeconds(),
        );
    }

    // note: the TTL is what makes the cached state honest. A device that stops reporting should stop
    // having a "current" state rather than serving a stale one forever — the entry expiring IS the
    // signal that we no longer know where the device is.
    private ttlSeconds(): number {
        return (
            this.configService.get<number>('TELEMETRY_LATEST_STATE_TTL_SECONDS') ??
            DeviceStateCache.DEFAULT_TTL_SECONDS
        );
    }

    private static keyFor(deviceId: string): string {
        return `${this.KEY_PREFIX}:${deviceId}`;
    }
}
