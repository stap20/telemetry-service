// cypod-telemetry
import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repo.interface';
import { ITokenGenerator } from '../../contracts/token-generator.interface';
import { AuthenticateCommand } from './authenticate.command';
import { AuthenticateResponse } from './authenticate.response';
import { Email } from '../../../domain/value-objects/email.vo';
import {
    InvalidCredentialError,
    UserIsInactiveError,
} from '../../errors/authentication.error';
import { CommandHandlerBase } from 'src/shared/application/command.handler.base';

@Injectable()
export class AuthenticateHandler extends CommandHandlerBase<
    AuthenticateCommand,
    AuthenticateResponse
> {
    constructor(
        @Inject(IUserRepository)
        private readonly userRepository: IUserRepository,
        @Inject(ITokenGenerator)
        private readonly tokenGenerator: ITokenGenerator,
    ) {
        super();
    }

    async handle(command: AuthenticateCommand): Promise<AuthenticateResponse> {
        const emailVO = Email.create(command.email);

        const user = await this.userRepository.getByEmail(emailVO);

        // note: return the SAME error (invalid_credentials / 401) for "no such account" and "wrong
        // password" so an attacker probing emails with junk passwords can't tell a registered address
        // from an unregistered one — closes the user-enumeration leak. The inactive check below only
        // runs after a correct password, so it isn't an enumeration vector.
        if (!user) {
            throw new InvalidCredentialError();
        }
        if (!(await user.validatePassword(command.password))) {
            throw new InvalidCredentialError();
        }
        if (!user.isActive()) {
            throw new UserIsInactiveError();
        }

        const signedData = {
            userId: user.getId().value,
            firstName: user.getName().value.firstName,
            lastName: user.getName().value.lastName,
            email: user.getEmail().value,
        };

        const token = await this.tokenGenerator.generateToken(signedData);

        this.logger.info('User logged in', {
            userId: user.getId().value,
            firstName: user.getName().value.firstName,
            lastName: user.getName().value.lastName,
        });

        return new AuthenticateResponse(
            signedData.userId,
            signedData.firstName,
            signedData.lastName,
            signedData.email,
            token,
        );
    }
}