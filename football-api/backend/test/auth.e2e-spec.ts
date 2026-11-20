import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { TEST_PASSWORD, TEST_USER, setTestAuthEnv } from './helpers/auth';

setTestAuthEnv();

interface LoginBody {
  accessToken: string;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const login = (username: unknown, password: unknown) =>
    request(server()).post('/api/auth/login').send({ username, password });

  it('login correcto responde 200 con accessToken', async () => {
    const res = await login(TEST_USER, TEST_PASSWORD).expect(200);
    const body = res.body as LoginBody;
    expect(typeof body.accessToken).toBe('string');
    token = body.accessToken;
  });

  it('login sin password responde 400', () => {
    return login(TEST_USER, undefined).expect(400);
  });

  it('contraseña incorrecta responde 401', () => {
    return login(TEST_USER, 'otra-clave').expect(401);
  });

  it('usuario incorrecto responde 401', () => {
    return login('otro', TEST_PASSWORD).expect(401);
  });

  it('sin token, el detalle responde 401', () => {
    return request(server()).get('/api/players/1').expect(401);
  });

  it('sin token, la exportacion CSV responde 401', () => {
    return request(server()).get('/api/players/export.csv').expect(401);
  });

  it('con token inválido responde 401', () => {
    return request(server())
      .get('/api/players/1')
      .set('Authorization', 'Bearer token-falso')
      .expect(401);
  });

  it('con token válido responde 200', () => {
    return request(server())
      .get('/api/players/1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
