// cypod-telemetry
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenGenerator } from '../../application/contracts/token-generator.interface';

@Injectable()
export class JwtTokenGenerator implements ITokenGenerator {
  constructor(private readonly jwtService: JwtService) {
  }

  async generateToken(payload: Record<string, any>): Promise<string> {
    try {
      const token = await this.jwtService.signAsync(payload);
      return token;
    } catch (error) {
      throw error;
    }
  }
}