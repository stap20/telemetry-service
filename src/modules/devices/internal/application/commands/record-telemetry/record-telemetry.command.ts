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
        // note: null, not undefined — "the device reported no fix" is a fact worth carrying, and a
        // command that can express it in only one way cannot drift between the two spellings.
        public readonly lat: number | null,
        public readonly lng: number | null,
        public readonly status: string | null,
        public readonly timestamp: Date,
    ) {}
}
