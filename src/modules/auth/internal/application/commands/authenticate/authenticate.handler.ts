// cypod-telemetry
import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repo.interface';
import { ITokenGenerator } from '../../contracts/token-generator.interface';
import { AuthenticateCommand } from './authenticate.command';
import { AuthenticateResponse } from './authenticate.response';
import { Email } from '../../../domain/value-objects/email.vo';
import {
    InvalidCredentialError,
    AuthenticateUserNotFoundError,
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

        if (!user) {
            throw new AuthenticateUserNotFoundError();
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