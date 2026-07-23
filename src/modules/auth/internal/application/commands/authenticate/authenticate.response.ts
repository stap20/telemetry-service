// cypod-telemetry
export class AuthenticateResponse {
    constructor(
        public readonly userId: string,
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly email: string,
        public readonly token: string
    ) { }
    
}