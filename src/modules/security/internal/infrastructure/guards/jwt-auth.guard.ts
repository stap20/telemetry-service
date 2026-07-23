// cypod-telemetry
// src/modules/security/internal/infrastructure/guards/jwt-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedError } from 'src/shared/application/errors/unauthorized.error';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);

        if (!token) {
            throw new UnauthorizedError('No authentication token provided');
        }

        try {
            request.user = this.jwtService.verify(token);
            return true;
        } catch {
            // note: collapse every jwt failure (expired/malformed/not-active) into a single 401 —
            // a client has no use for the distinction and it avoids leaking token internals.
            throw new UnauthorizedError('Invalid or expired authentication token');
        }
    }

    private extractToken(request: any): string | undefined {
        if (request.cookies?.auth_token) {
            return request.cookies.auth_token;
        }
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
