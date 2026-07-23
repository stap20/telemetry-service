// cypod-telemetry
// src/modules/devices/internal/infrastructure/query-handlers/get-latest-device-state.handler.ts
import { Injectable, Inject } from '@nestjs/common';
import { ILogger } from 'src/shared/domain/contracts/logger.interface';
import { NestLogger } from 'src/shared/infrastructure/logger/nest-logger';
import { IGetLatestDeviceStateHandler } from '../../application/queries/get-latest-device-state/get-latest-device-state.handler.interface';
import { GetLatestDeviceStateQuery } from '../../application/queries/get-latest-device-state/get-latest-device-state.query';
import {
    CacheOutcome,
    GetLatestDeviceStateResponse,
} from '../../application/queries/get-latest-device-state/get-latest-device-state.response';
import {
    IDeviceStateCache,
    LatestDeviceState,
} from '../../application/contracts/device-state-cache.interface';
import { DeviceNotFoundError } from '../../application/errors/device-not-found.error';
import { LatestStateUnavailableError } from '../../application/errors/latest-state-unavailable.error';
import { ReadDeviceRepository } from '../repositories/read-device.repository';
import { ReadTelemetryRepository } from '../repositories/read-telemetry.repository';

@Injectable()
export class GetLatestDeviceStateHandler implements IGetLatestDeviceStateHandler {
    // note: query handlers normally stay silent, but HIT/MISS is an explicit operational
    // requirement here — without it nobody can tell whether the cache is earning its keep or
    // quietly missing every time. Instantiated directly because there is no query-handler base
    // class carrying a logger, matching how CommandHandlerBase builds its own.
    private readonly logger: ILogger = new NestLogger();

    constructor(
        private readonly readDeviceRepository: ReadDeviceRepository,
        private readonly readTelemetryRepository: ReadTelemetryRepository,
        @Inject(IDeviceStateCache)
        private readonly deviceStateCache: IDeviceStateCache,
    ) {}

    async handle(
        query: GetLatestDeviceStateQuery,
    ): Promise<GetLatestDeviceStateResponse> {
        // note: ownership is verified BEFORE the cache is consulted, and that order is the whole
        // security of this endpoint. Reading the cache first and checking afterwards would be
        // faster and would still return the right answer — but a warm cache would then be a way to
        // confirm which device ids exist, and one early return away from serving them outright.
        // The cache is allowed to accelerate an answer, never to decide who may ask the question.
        const device = await this.readDeviceRepository.findOwnedById(
            query.deviceId,
            query.ownerId,
        );

        if (!device) {
            throw new DeviceNotFoundError(query.deviceId);
        }

        const cached = await this.readThroughCache(query.deviceId);

        if (cached) {
            this.logger.info('Latest device state served', {
                deviceId: query.deviceId,
                cache: CacheOutcome.HIT,
            });

            return this.toResponse(cached, CacheOutcome.HIT);
        }

        const stored = await this.readTelemetryRepository.findLatestByDeviceId(
            query.deviceId,
        );

        // note: the device exists and is the caller's, it has simply never reported. Nothing is
        // written to the cache here — caching "no data" would mean a device's first reading could
        // not be seen until the negative entry expired.
        if (!stored) {
            throw new LatestStateUnavailableError(query.deviceId);
        }

        const state: LatestDeviceState = {
            deviceId: stored.deviceId,
            battery: stored.battery,
            temperature: stored.temperature,
            lat: stored.lat,
            lng: stored.lng,
            status: stored.status,
            recordedAt: stored.recordedAt.toISOString(),
        };

        await this.repopulate(state);

        this.logger.info('Latest device state served', {
            deviceId: query.deviceId,
            cache: CacheOutcome.MISS,
        });

        return this.toResponse(state, CacheOutcome.MISS);
    }

    // note: a cache that is down must degrade to a slow endpoint, not a broken one. Redis being
    // unreachable is logged and then treated exactly like a miss, so the database answer still
    // goes out — the read path has no reason to fail just because its accelerator did.
    private async readThroughCache(
        deviceId: string,
    ): Promise<LatestDeviceState | null> {
        try {
            return await this.deviceStateCache.findLatest(deviceId);
        } catch (error) {
            this.logger.error(
                'Failed to read cached latest device state',
                error as Error,
                { deviceId },
            );

            return null;
        }
    }

    // note: repopulation failing is even less serious — the answer is already in hand and the only
    // cost is that the next request misses too. Never worth failing the response over.
    private async repopulate(state: LatestDeviceState): Promise<void> {
        try {
            await this.deviceStateCache.saveLatest(state);
        } catch (error) {
            this.logger.error(
                'Failed to repopulate cached latest device state',
                error as Error,
                { deviceId: state.deviceId },
            );
        }
    }

    private toResponse(
        state: LatestDeviceState,
        outcome: CacheOutcome,
    ): GetLatestDeviceStateResponse {
        return new GetLatestDeviceStateResponse(
            state.deviceId,
            state.battery,
            state.temperature,
            state.lat,
            state.lng,
            state.status,
            new Date(state.recordedAt),
            outcome,
        );
    }
}
