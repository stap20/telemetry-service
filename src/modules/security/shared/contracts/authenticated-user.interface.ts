// cypod-telemetry
// src/modules/security/shared/contracts/authenticated-user.interface.ts
export interface AuthenticatedUser {
    userId: string;
    token: string;
    firstName: string;
    lastName: string;
    email: string;
}
