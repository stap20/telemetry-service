// cypod-telemetry
// src/modules/auth/internal/application/commands/register/register.response.ts
export class RegisterResponse {
    constructor(
        public readonly userId: string,
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly email: string,
        public readonly token: string,
    ) {}
}
