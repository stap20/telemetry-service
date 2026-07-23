// cypod-telemetry
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
    @ApiProperty({
        description: 'User email address used for authentication',
        example: 'admin@example.com',
        type: 'string',
        format: 'email',
        maxLength: 255,
        minLength: 5
    })
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'User password for authentication',
        example: 'admin',
        type: 'string',
        minLength: 5,
        format: 'password'
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}