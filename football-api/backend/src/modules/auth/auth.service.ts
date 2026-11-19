import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

export interface LoginResult {
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(username: string, password: string): Promise<LoginResult> {
    const adminUser = this.config.get<string>('ADMIN_USER');
    const passwordHash = this.config.get<string>('ADMIN_PASSWORD_HASH');

    const passwordOk =
      !!passwordHash && (await bcrypt.compare(password, passwordHash));

    if (!adminUser || username !== adminUser || !passwordOk) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    const accessToken = await this.jwt.signAsync({ sub: username });
    return { accessToken };
  }
}
