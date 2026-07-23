// cypod-telemetry
// src/shared/infrastructure/cache/redis.connection.ts
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { NestLogger } from '../logger/nest-logger';

@Injectable()
export class RedisConnection implements OnApplicationShutdown {
    readonly client: Redis;
    private readonly logger = new NestLogger();

    constructor(configService: ConfigService) {
        this.client = new Redis({
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
            connectTimeout: 2000,
            // note: fail fast instead of buffering commands when Redis is unavailable —
            // the latest-state cache falls back to the DB, so a dead cache must never hang requests.
            enableOfflineQueue: false,
            maxRetriesPerRequest: 1,
        });

        // note: without this listener ioredis emits unhandled 'error' events that flood the
        // process (and can crash it) whenever Redis is unreachable.
        this.client.on('error', (error: Error) => {
            this.logger.error('Redis connection error', error, 'RedisConnection');
        });
    }

    async onApplicationShutdown(): Promise<void> {
        // note: quit() drains in-flight replies before closing; disconnect() would drop them.
        await this.client.quit();
        this.logger.info('Redis connection closed', 'RedisConnection');
    }
}
