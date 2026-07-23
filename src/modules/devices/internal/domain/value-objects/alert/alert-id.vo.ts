// cypod-telemetry
import { ValueObject } from 'src/shared/domain/value-objects/value-object';
import { ValueValidator } from 'src/shared/domain/value-objects/value-validator';
import {
    EmptyAlertIdError,
    InvalidAlertIdFormatError,
} from '../../errors/alert/alert.error';

export class AlertId extends ValueObject<string> {
    private constructor(value: string) {
        super(value);
    }

    public static create(id: string): AlertId {
        this.validate(id);
        return new AlertId(id);
    }

    private static validate(id: string): void {
        if (ValueValidator.isEmpty(id)) {
            throw new EmptyAlertIdError();
        }

        if (!ValueValidator.isValidUUID(id)) {
            throw new InvalidAlertIdFormatError();
        }
    }
}
