// cypod-telemetry
// src/modules/auth/internal/presentation/dtos/responses/auth.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
    @ApiProperty({
        description: 'Unique identifier of the user',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        type: 'string',
        format: 'uuid',
    })
    id: string;

    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@company.com',
        type: 'string',
        format: 'email',
    })
    email: string;

    @ApiProperty({
        description: 'User first name',
        example: 'John',
        type: 'string',
    })
    firstName: string;

    @ApiProperty({
        description: 'User last name',
        example: 'Doe',
        type: 'string',
    })
    lastName: string;

    @ApiProperty({
        description: 'Signed JWT access token (also set as an httpOnly cookie)',
        type: 'string',
    })
    accessToken: string;

    constructor(
        id: string,
        email: string,
        firstName: string,
        lastName: string,
        accessToken: string,
    ) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.accessToken = accessToken;
    }
}
