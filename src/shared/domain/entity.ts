// cypod-telemetry
import { DomainEvent } from './events/domain-event';

export abstract class Entity<T> {
    private domainEvents: DomainEvent[] = [];

    constructor(protected readonly id: T) {}

    public getId(): T {
        return this.id;
    }

    public abstract equals(other: Entity<T>): boolean;

    protected addDomainEvent(event: DomainEvent): void {
        this.domainEvents.push(event);
    }

    public getDomainEvents(): DomainEvent[] {
        return this.domainEvents;
    }

    public clearDomainEvents(): void {
        this.domainEvents = [];
    }
}
