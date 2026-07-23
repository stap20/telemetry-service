// cypod-telemetry
// src/shared/infrastructure/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
            envFilePath:
                process.env.NODE_ENV?.trim() === 'production'
                    ? '.env.production'
                    : '.env',
            cache: true,
            expandVariables: true,
        }),
    ],
})
export class ConfigModule {}
