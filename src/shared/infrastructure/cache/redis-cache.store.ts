// cypod-telemetry
// src/shared/infrastructure/cache/redis-cache.store.ts
import { Injectable } from '@nestjs/common';
import { ICachePort } from '../../domain/contracts/cache.port';
import { RedisConnection } from './redis.connection';

@Injectable()
export class RedisCacheStore implements ICachePort {
    constructor(private readonly connection: RedisConnection) {}

    async get<T>(key: string): Promise<T | null> {
        const raw = await this.connection.client.get(key);
        return raw === null ? null : (JSON.parse(raw) as T);
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        const raw = JSON.stringify(value);
        if (ttlSeconds !== undefined) {
            await this.connection.client.set(key, raw, 'EX', ttlSeconds);
            return;
        }
        await this.connection.client.set(key, raw);
    }

    async delete(key: string): Promise<void> {
        await this.connection.client.del(key);
    }
}
