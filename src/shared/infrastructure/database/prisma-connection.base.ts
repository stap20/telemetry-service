// cypod-telemetry
// src/shared/infrastructure/database/prisma-connection.base.ts
import { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { NestLogger } from '../logger/nest-logger';

// note: every module owns its own database (isolated, per-module Prisma client), so each one
// needs the exact same connection lifecycle: connect fail-fast at boot, disconnect and close the
// pool on shutdown, log both. I made this an abstract base ON PURPOSE — the lifecycle (the part
// that is easy to get wrong and dangerous to forget, e.g. a leaked pool on SIGTERM) lives here
// once and is inherited, while each module only fills in the two things that actually differ:
// which env var holds its connection string, and how to build its own generated client. A new
// module (or a new developer) cannot forget shutdown handling because they never write it — the
// parent owns that headache. This is the Template Method pattern applied to DB connections.
//
// note: this is COMPOSITION over the client (we expose `.client`), not `extends PrismaClient` —
// each module generates a DIFFERENT PrismaClient class, so there is no single client type to
// extend. Exposing `.client` also keeps every infra connection shaped like RedisConnection.
type PrismaLifecycle = {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
};

export abstract class PrismaConnectionBase<TClient extends PrismaLifecycle>
    implements OnModuleInit, OnApplicationShutdown
{
    readonly client: TClient;
    protected readonly pool: Pool;
    private readonly logger = new NestLogger();

    constructor(configService: ConfigService) {
        this.pool = new Pool({
            connectionString: this.resolveConnectionString(configService),
            // note: fail fast on an unreachable DB instead of hanging the request thread.
            connectionTimeoutMillis: 5000,
        });
        this.client = this.createClient(this.pool);
    }

    // note: the only two things a module must supply — everything else is handled here.
    protected abstract resolveConnectionString(
        configService: ConfigService,
    ): string;
    protected abstract createClient(pool: Pool): TClient;

    async onModuleInit(): Promise<void> {
        // note: connect at boot so a misconfigured DB fails startup, not the first request.
        await this.client.$connect();
        this.logger.info(`${this.constructor.name} connected`, 'PrismaConnection');
    }

    async onApplicationShutdown(): Promise<void> {
        // note: drain Prisma then close the pg pool so no sockets leak on SIGINT/SIGTERM.
        await this.client.$disconnect();
        await this.pool.end();
        this.logger.info(`${this.constructor.name} closed`, 'PrismaConnection');
    }
}
