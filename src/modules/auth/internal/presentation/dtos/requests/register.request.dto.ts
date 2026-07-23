// cypod-telemetry
// src/modules/auth/internal/presentation/dtos/requests/register.request.dto.ts
import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterRequestDto {
    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@company.com',
        type: 'string',
        format: 'email',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'User password (minimum 5 characters)',
        example: 'secret',
        type: 'string',
        format: 'password',
        minLength: 5,
    })
    @IsString()
    @MinLength(5)
    password: string;

    @ApiProperty({ description: 'User first name', example: 'John' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ description: 'User last name', example: 'Doe' })
    @IsString()
    @IsNotEmpty()
    lastName: string;
}
