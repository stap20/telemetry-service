// cypod-telemetry
// src/modules/auth/internal/presentation/controllers/logout.controller.ts
import {
    Controller,
    Post,
    Version,
    Res,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AuthCookieService } from '../services/auth-cookie.service';

// note: one use-case per controller (logout) so each endpoint reads top-to-bottom on its own.
@ApiTags('Authentication')
@Controller('auth')
export class LogoutController {
    constructor(private readonly authCookie: AuthCookieService) {}

    @Version('1')
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Clear the authentication cookie' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    logout(@Res({ passthrough: true }) res: Response): void {
        this.authCookie.clear(res);
    }
}
