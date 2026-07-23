// cypod-telemetry
import { BadRequestError } from 'src/shared/application/errors/bad-request.error';

// note: an application error, not a domain one. CQRS keeps queries out of the domain, so there is
// no value object to enforce this — but "from must not come after to" is still a rule, and it
// belongs in the layer that owns the query. Rejecting it outright rather than quietly returning an
// empty page matters: an empty result reads as "this device reported nothing in that window",
// which would send someone hunting for a hardware fault that does not exist.
export class InvalidHistoryRangeError extends BadRequestError {
    constructor() {
        super(
            'History range start must not be after its end',
            'devices.history_range_invalid',
        );
    }
}
