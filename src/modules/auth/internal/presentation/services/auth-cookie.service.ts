// cypod-telemetry
// src/modules/auth/internal/presentation/services/auth-cookie.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

// note: each endpoint has its own use-case controller for readability, but register and login both
// set the same auth cookie. Rather than duplicate the cookie/duration logic in two controllers, it
// lives here once as a thin presentation helper both controllers inject. Keeps the split-controller
// style DRY without leaking HTTP concerns into the application layer.
@Injectable()
export class AuthCookieService {
    private static readonly COOKIE_NAME = 'auth_token';

    constructor(private readonly configService: ConfigService) {}

    set(res: Response, token: string): void {
        res.cookie(AuthCookieService.COOKIE_NAME, token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: this.parseDuration(
                this.configService.get<string>('JWT_EXPIRES_IN'),
            ),
        });
    }

    clear(res: Response): void {
        res.clearCookie(AuthCookieService.COOKIE_NAME);
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
