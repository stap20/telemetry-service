// cypod-telemetry
export abstract class IntegrationEvent {
    public readonly occurredOn: Date;
    public readonly eventId: string;
    public readonly eventType: string;
    public readonly version: number;

    constructor(version: number = 1) {
        this.occurredOn = new Date();
        this.eventId = crypto.randomUUID();
        this.eventType = this.constructor.name;
        this.version = version;
    }
}
