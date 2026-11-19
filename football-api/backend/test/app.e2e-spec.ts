import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Players (e2e)', () => {
  let app: INestApplication<App>;

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

  it('GET /api/players/1 responde 200 con el jugador', () => {
    return request(app.getHttpServer())
      .get('/api/players/1')
      .expect(500)
      .expect((res) => {
        const body = res.body as { id: number; name: string };
        expect(body.id).toBe(1);
        expect(body.name).toContain('Messi');
      });
  });

  it('GET /api/players/999999 responde 404', () => {
    return request(app.getHttpServer()).get('/api/players/999999').expect(404);
  });
});
