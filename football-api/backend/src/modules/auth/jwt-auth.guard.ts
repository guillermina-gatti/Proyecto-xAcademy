import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';

// Guard global: todos los endpoints exigen un JWT válido, salvo los marcados con @Public().
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Falta el token de autenticación.');
    }

    try {
      await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Token inválido o vencido.');
    }
    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const [type, token] = (request.headers.authorization ?? '').split(' ');
    return type === 'Bearer' && token ? token : undefined;
  }
}
