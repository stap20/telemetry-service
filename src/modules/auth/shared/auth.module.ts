// cypod-telemetry
// src/modules/auth/shared/auth.module.ts
import { Module } from '@nestjs/common';

import { SecurityModule } from 'src/modules/security/shared/security.module';

import { RegisterController } from '../internal/presentation/controllers/register.controller';
import { LoginController } from '../internal/presentation/controllers/login.controller';
import { LogoutController } from '../internal/presentation/controllers/logout.controller';
import { AuthCookieService } from '../internal/presentation/services/auth-cookie.service';

import { AuthenticateHandler } from '../internal/application/commands/authenticate/authenticate.handler';
import { RegisterHandler } from '../internal/application/commands/register/register.handler';

import { ITokenGenerator } from '../internal/application/contracts/token-generator.interface';
import { IUserRepository } from '../internal/domain/repositories/user.repo.interface';

import { UserMapper } from '../internal/infrastructure/database/mappers/user.mapper';
import { JwtTokenGenerator } from '../internal/infrastructure/auth/jwt-token-generator';
import { UserRepository } from '../internal/infrastructure/repositories/user.repository';
import { AuthPrismaConnection } from '../internal/infrastructure/database/auth-prisma.connection';
import { IAuthPrismaClient } from '../internal/infrastructure/database/auth.prisma.client.interface';

@Module({
    imports: [SecurityModule],
    providers: [
        AuthPrismaConnection,
        // note: expose the raw client under the token so repositories depend on IAuthPrismaClient,
        // never on the connection wrapper — the connection alone owns the lifecycle hooks.
        {
            provide: IAuthPrismaClient,
            useFactory: (connection: AuthPrismaConnection) => connection.client,
            inject: [AuthPrismaConnection],
        },
        AuthenticateHandler,
        RegisterHandler,
        UserMapper,
        AuthCookieService,
        { provide: IUserRepository, useClass: UserRepository },
        { provide: ITokenGenerator, useClass: JwtTokenGenerator },
    ],
    controllers: [RegisterController, LoginController, LogoutController],
})
export class AuthModule {}
