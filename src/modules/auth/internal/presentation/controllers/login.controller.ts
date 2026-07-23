// cypod-telemetry
// src/modules/auth/internal/presentation/controllers/login.controller.ts
import {
    Controller,
    Post,
    Body,
    Version,
    Inject,
    Res,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AuthenticateHandler } from '../../application/commands/authenticate/authenticate.handler';
import { AuthenticateCommand } from '../../application/commands/authenticate/authenticate.command';
import { LoginRequestDto } from '../dtos/requests/login.request.dto';
import { AuthResponseDto } from '../dtos/responses/auth.response.dto';
import { AuthCookieService } from '../services/auth-cookie.service';

// note: one use-case per controller (login) so each endpoint reads top-to-bottom on its own.
@ApiTags('Authentication')
@Controller('auth')
export class LoginController {
    constructor(
        @Inject(AuthenticateHandler)
        private readonly authenticateHandler: AuthenticateHandler,
        private readonly authCookie: AuthCookieService,
    ) {}

    @Version('1')
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Authenticate a user and issue a JWT' })
    @ApiResponse({ status: 200, description: 'Authentication successful', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(
        @Body() loginDto: LoginRequestDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<AuthResponseDto> {
        const result = await this.authenticateHandler.handle(
            new AuthenticateCommand(loginDto.email, loginDto.password),
        );

        this.authCookie.set(res, result.token);

        return new AuthResponseDto(
            result.userId,
            result.email,
            result.firstName,
            result.lastName,
            result.token,
        );
    }
}
