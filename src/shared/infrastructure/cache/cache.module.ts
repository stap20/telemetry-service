// cypod-telemetry
// src/shared/infrastructure/cache/cache.module.ts
import { Global, Module } from '@nestjs/common';
import { ICachePort } from '../../domain/contracts/cache.port';
import { RedisConnection } from './redis.connection';
import { RedisCacheStore } from './redis-cache.store';

@Global()
@Module({
    providers: [
        RedisConnection,
        { provide: ICachePort, useClass: RedisCacheStore },
    ],
    // note: RedisConnection is exported too so infra-only consumers (rate limiter, offline
    // backlog) can use raw Redis atomics — app/domain layers must depend on ICachePort only.
    exports: [ICachePort, RedisConnection],
})
export class CacheModule {}
