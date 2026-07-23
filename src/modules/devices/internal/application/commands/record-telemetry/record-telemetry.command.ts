// cypod-telemetry
import { ICommand } from 'src/shared/application/command.interface';

// note: deviceId comes from the URL and ownerId from the JWT — never from the body. The caller can
// only ever write telemetry against a device they already own.
export class RecordTelemetryCommand implements ICommand {
    constructor(
        public readonly deviceId: string,
        public readonly ownerId: string,
        public readonly battery: number,
        public readonly temperature: number,
        public readonly lat: number,
        public readonly lng: number,
        public readonly status: string,
        public readonly timestamp: Date,
    ) {}
}
