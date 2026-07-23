// cypod-telemetry
export class RegisterDeviceResponse {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly ownerId: string,
    ) {}
}
