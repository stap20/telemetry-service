// cypod-telemetry
export interface IIdGenerator {
    generate(): string;
}

export const IIdGenerator = Symbol('IIdGenerator');
