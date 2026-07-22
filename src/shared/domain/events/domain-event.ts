// cypod-telemetry
export abstract class DomainEvent {
    public readonly occurredOn: Date;
    public readonly eventId: string;
    public readonly eventType: string;

    constructor() {
        this.occurredOn = new Date();
        this.eventId = crypto.randomUUID();
        this.eventType = this.constructor.name;
    }
}
