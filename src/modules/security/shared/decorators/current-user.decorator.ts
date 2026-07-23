// cypod-telemetry
// src/modules/security/shared/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../contracts/authenticated-user.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser | null => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
        return null;
    }

    const token = request.headers['authorization']?.split(' ')[1] || request.cookies?.['auth_token'] || '';

    return {
        userId: user.userId,
        token: token,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
    };
  },
);
