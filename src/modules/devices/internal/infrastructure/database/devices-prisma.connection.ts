// cypod-telemetry
// src/modules/devices/internal/infrastructure/database/devices-prisma.connection.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaConnectionBase } from 'src/shared/infrastructure/database/prisma-connection.base';
import { PrismaClient } from './prisma/generated/client';

// note: the whole connection lifecycle (connect/disconnect/pool cleanup) is inherited from
// PrismaConnectionBase — this class only declares which DB this module owns and how to build its
// own generated client. Same two methods as AuthPrismaConnection, nothing more.
@Injectable()
export class DevicesPrismaConnection extends PrismaConnectionBase<PrismaClient> {
    constructor(configService: ConfigService) {
        super(configService);
    }

    protected resolveConnectionString(configService: ConfigService): string {
        return configService.get<string>('DEVICES_DATABASE_URL')!;
    }

    protected createClient(pool: Pool): PrismaClient {
        return new PrismaClient({ adapter: new PrismaPg(pool) });
    }
}
