// cypod-telemetry
import { NotFoundError } from "src/shared/application/errors/notfound.error";
import { UnauthorizedError } from "src/shared/application/errors/unauthorized.error";

export class InvalidCredentialError extends UnauthorizedError {
  constructor() {
    super("Invalid credentials provided.", 'auth.invalid_credentials');
  }
}

export class AuthenticateUserNotFoundError extends NotFoundError {
    constructor() {
        super("User with the provided credentials was not found.", 'auth.user_not_found');
    }
}

export class UserIsInactiveError extends UnauthorizedError {
    constructor() {
        super("The user account is inactive.", 'auth.user_inactive');
    }
}