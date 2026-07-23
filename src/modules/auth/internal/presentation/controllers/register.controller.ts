// cypod-telemetry
// src/modules/auth/internal/presentation/controllers/register.controller.ts
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

import { RegisterHandler } from '../../application/commands/register/register.handler';
import { RegisterCommand } from '../../application/commands/register/register.command';
import { RegisterRequestDto } from '../dtos/requests/register.request.dto';
import { AuthResponseDto } from '../dtos/responses/auth.response.dto';
import { AuthCookieService } from '../services/auth-cookie.service';

// note: one use-case per controller (register) so each endpoint reads top-to-bottom on its own.
@ApiTags('Authentication')
@Controller('auth')
export class RegisterController {
    constructor(
        @Inject(RegisterHandler)
        private readonly registerHandler: RegisterHandler,
        private readonly authCookie: AuthCookieService,
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
