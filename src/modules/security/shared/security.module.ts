// cypod-telemetry
// src/modules/security/shared/security.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { JwtAuthGuard } from '../internal/infrastructure/guards/jwt-auth.guard';

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
export class SecurityModule {}
