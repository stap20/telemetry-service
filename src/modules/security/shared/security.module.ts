// cypod-telemetry
// src/modules/security/shared/security.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { LocalizationService } from 'src/shared/infrastructure/i18n/localization.service';
import { JwtAuthGuard } from '../internal/infrastructure/guards/jwt-auth.guard';

import en from './i18n/en.json';
import ar from './i18n/ar.json';

@Module({
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>(
                        'JWT_EXPIRES_IN',
                    ) as any,
                },
            }),
        }),
    ],
    providers: [JwtAuthGuard],
    // note: JwtModule is re-exported so the auth module's token generator can inject JwtService.
    exports: [JwtModule, JwtAuthGuard],
})
export class SecurityModule implements OnModuleInit {
    // note: the module publishes its OWN shared/i18n catalogs into the global service — the filter
    // never reaches into this module. Adding a language = drop a file here; nothing else changes.
    constructor(private readonly localization: LocalizationService) {}

    onModuleInit(): void {
        this.localization.register('en', en);
        this.localization.register('ar', ar);
    }
}
