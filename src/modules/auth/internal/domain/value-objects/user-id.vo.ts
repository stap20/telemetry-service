// cypod-telemetry
import { ValueObject } from 'src/shared/domain/value-objects/value-object';
import { EmptyUserIdError, InvalidUserIdFormatError } from '../errors/user-id.error';
import { ValueValidator } from 'src/shared/domain/value-objects/value-validator';

export class UserId extends ValueObject<string> {
    private constructor(value: string) {
        super(value);
    }

    public static create(id: string): UserId {
        this.validate(id);
        return new UserId(id);
    }

    private static validate(id: string): void {
        if (ValueValidator.isEmpty(id)) {
            throw new EmptyUserIdError();
        }

        if (!ValueValidator.isValidUUID(id)) {
            throw new InvalidUserIdFormatError();
        }
    }
} 