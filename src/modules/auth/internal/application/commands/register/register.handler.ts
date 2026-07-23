// cypod-telemetry
// src/modules/auth/internal/application/commands/register/register.handler.ts
import { Injectable, Inject } from '@nestjs/common';
import { CommandHandlerBase } from 'src/shared/application/command.handler.base';
import { IUserRepository } from '../../../domain/repositories/user.repo.interface';
import { ITokenGenerator } from '../../contracts/token-generator.interface';
import { User } from '../../../domain/entities/user.aggregate';
import { Email } from '../../../domain/value-objects/email.vo';
import { UserAlreadyExistsError } from '../../../domain/errors/user.error';
import { RegisterCommand } from './register.command';
import { RegisterResponse } from './register.response';

@Injectable()
export class RegisterHandler extends CommandHandlerBase<
    RegisterCommand,
    RegisterResponse
> {
    constructor(
        @Inject(IUserRepository)
        private readonly userRepository: IUserRepository,
        @Inject(ITokenGenerator)
        private readonly tokenGenerator: ITokenGenerator,
    ) {
        super();
    }

    async handle(command: RegisterCommand): Promise<RegisterResponse> {
        const email = Email.create(command.email);

        const existing = await this.userRepository.getByEmail(email);
        if (existing) {
            throw new UserAlreadyExistsError(command.email);
        }

        const user = await User.create({
            id: this.userRepository.generateId(),
            email: command.email,
            password: command.password,
            firstName: command.firstName,
            lastName: command.lastName,
        });

        await this.userRepository.save(user);

        const signedData = {
            userId: user.getId().value,
            firstName: user.getName().getFirstName(),
            lastName: user.getName().getLastName(),
            email: user.getEmail().value,
        };

        const token = await this.tokenGenerator.generateToken(signedData);

        this.logger.info('User registered', { userId: signedData.userId });

        return new RegisterResponse(
            signedData.userId,
            signedData.firstName,
            signedData.lastName,
            signedData.email,
            token,
        );
    }
}
