import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';

export const TEST_USER = 'admin';
export const TEST_PASSWORD = 'clave-de-prueba';

// Completa las variables de auth solo si no vienen del entorno.
// Debe llamarse antes de compilar el módulo de pruebas.
export function setTestAuthEnv(): void {
  process.env.JWT_SECRET ??= 'secreto-de-prueba';
  process.env.ADMIN_USER ??= TEST_USER;
  process.env.ADMIN_PASSWORD_HASH ??= bcrypt.hashSync(TEST_PASSWORD, 10);
}

// Para los e2e de jugadores: cada request llega con un token válido.
// El flujo de login se prueba en auth.e2e-spec.ts.
export function authenticateRequests(
  moduleFixture: TestingModule,
  app: INestApplication,
): void {
  const token = moduleFixture.get(JwtService).sign({ sub: TEST_USER });
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.headers.authorization = `Bearer ${token}`;
    next();
  });
}
