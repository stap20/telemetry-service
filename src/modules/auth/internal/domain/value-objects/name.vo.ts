// cypod-telemetry
import { ValueObject } from "src/shared/domain/value-objects/value-object";
import { 
  EmptyNameError, 
  NameTooShortError, 
  NameTooLongError, 
  InvalidNameFormatError 
} from '../errors/name.error';

interface NameProps {
  firstName: string;
  lastName: string;
}

export class Name extends ValueObject<NameProps> {
    private constructor(props: NameProps) {
        super(props);
    }

    public static create(props: NameProps): Name {
        this.validateFirstName(props.firstName);
        this.validateLastName(props.lastName);
        return new Name(props);
    }

    private static validateFirstName(firstName: string): void {
        if (!firstName) {
            throw new EmptyNameError('firstName');
        }

        if (firstName.length < 2) {
            throw new NameTooShortError('firstName');
        }

        if (firstName.length > 50) {
            throw new NameTooLongError('firstName');
        }

        if (!/^[\u0600-\u06FFa-zA-Z\s-']+$/.test(firstName)) {
            throw new InvalidNameFormatError('firstName');
        }
    }

    private static validateLastName(lastName: string): void {
        if (!lastName) {
            throw new EmptyNameError('lastName');
        }

        if (lastName.length < 2) {
            throw new NameTooShortError('lastName');
        }

        if (lastName.length > 50) {
            throw new NameTooLongError('lastName');
        }

        if (!/^[\u0600-\u06FFa-zA-Z\s-']+$/.test(lastName)) {
            throw new InvalidNameFormatError('lastName');
        }
    }

    public getFirstName(): string {
        return this._value.firstName;
    }

    public getLastName(): string {
        return this._value.lastName;
    }

    public getFullName(): string {
        return `${this._value.firstName} ${this._value.lastName}`;
    }
}