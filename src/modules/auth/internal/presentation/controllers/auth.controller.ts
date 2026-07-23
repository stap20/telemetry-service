// cypod-telemetry
// src/modules/auth/internal/presentation/controllers/auth.controller.ts
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
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AuthenticateHandler } from '../../application/commands/authenticate/authenticate.handler';
import { AuthenticateCommand } from '../../application/commands/authenticate/authenticate.command';
import { RegisterHandler } from '../../application/commands/register/register.handler';
import { RegisterCommand } from '../../application/commands/register/register.command';
import { LoginRequestDto } from '../dtos/requests/login.request.dto';
import { RegisterRequestDto } from '../dtos/requests/register.request.dto';
import { AuthResponseDto } from '../dtos/responses/auth.response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        @Inject(AuthenticateHandler)
        private readonly authenticateHandler: AuthenticateHandler,
        @Inject(RegisterHandler)
        private readonly registerHandler: RegisterHandler,
        private readonly configService: ConfigService,
    ) {}

    @Version('1')
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new user and issue a JWT' })
    @ApiResponse({ status: 201, description: 'Registration successful', type: AuthResponseDto })
    @ApiResponse({ status: 409, description: 'Email already registered' })
    async register(
        @Body() registerDto: RegisterRequestDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<AuthResponseDto> {
        const result = await this.registerHandler.handle(
            new RegisterCommand(
                registerDto.email,
                registerDto.password,
                registerDto.firstName,
                registerDto.lastName,
            ),
        );

        this.setAuthCookie(res, result.token);

        return new AuthResponseDto(
            result.userId,
            result.email,
            result.firstName,
            result.lastName,
            result.token,
        );
    }

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

        this.setAuthCookie(res, result.token);

        return new AuthResponseDto(
            result.userId,
            result.email,
            result.firstName,
            result.lastName,
            result.token,
        );
    }

    @Version('1')
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Clear the authentication cookie' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    logout(@Res({ passthrough: true }) res: Response): void {
        res.clearCookie('auth_token');
    }

    private setAuthCookie(res: Response, token: string): void {
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: this.parseDuration(
                this.configService.get<string>('JWT_EXPIRES_IN'),
            ),
        });
    }

    // note: JWT_EXPIRES_IN may be a raw ms number or a "15m"/"24h"/"7d" string; the cookie needs
    // a ms maxAge, so normalize both forms (default 1h if unset/unparseable).
    private parseDuration(duration: string | undefined): number {
        const oneHour = 1000 * 60 * 60;
        if (!duration) {
            return oneHour;
        }
        if (!isNaN(Number(duration))) {
            return Number(duration);
        }

        const match = duration.match(/^(\d+)([smhd])$/);
        if (!match) {
            return oneHour;
        }

        const value = parseInt(match[1], 10);
        switch (match[2]) {
            case 's':
                return value * 1000;
            case 'm':
                return value * 1000 * 60;
            case 'h':
                return value * 1000 * 60 * 60;
            case 'd':
                return value * 1000 * 60 * 60 * 24;
            default:
                return oneHour;
        }
    }
}
