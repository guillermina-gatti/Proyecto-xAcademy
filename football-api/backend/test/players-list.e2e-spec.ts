import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

// Requiere la base cargada con los fixtures:
// 20 jugadores masculinos y 12 femeninos (32 en total).
interface PlayerListBody {
  data: { id: number; name: string; club: string; nationality: string }[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

describe('Players list (e2e)', () => {
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

  const list = (query = '') =>
    request(app.getHttpServer()).get(`/api/players${query}`);

  it('responde 200 con data y meta', () => {
    return list('?page=1&limit=5')
      .expect(200)
      .expect((res) => {
        const body = res.body as PlayerListBody;
        expect(body.data).toHaveLength(5);
        expect(body.meta).toEqual({
          page: 1,
          limit: 5,
          total: 32,
          totalPages: 7,
        });
      });
  });

  it('usa page=1 y limit=20 por defecto', () => {
    return list()
      .expect(200)
      .expect((res) => {
        const body = res.body as PlayerListBody;
        expect(body.meta.page).toBe(1);
        expect(body.meta.limit).toBe(20);
        expect(body.data).toHaveLength(20);
      });
  });

  it('paginas consecutivas no repiten jugadores y van en orden de id', async () => {
    const first = (await list('?page=1&limit=10')).body as PlayerListBody;
    const second = (await list('?page=2&limit=10')).body as PlayerListBody;

    const ids1 = first.data.map((p) => p.id);
    const ids2 = second.data.map((p) => p.id);

    expect(ids1).toHaveLength(10);
    expect(ids2).toHaveLength(10);
    expect(ids1.filter((id) => ids2.includes(id))).toEqual([]);
    expect(ids1).toEqual([...ids1].sort((a, b) => a - b));
    expect(Math.max(...ids1)).toBeLessThan(Math.min(...ids2));
  });

  it('filtra por genero', async () => {
    const female = (await list('?gender=female&limit=100')).body as PlayerListBody;
    const male = (await list('?gender=male&limit=100')).body as PlayerListBody;
    expect(female.meta.total).toBe(12);
    expect(male.meta.total).toBe(20);
  });

  it('filtra por version de FIFA', async () => {
    const v23 = (await list('?fifaVersion=23&limit=100')).body as PlayerListBody;
    const v15 = (await list('?fifaVersion=15&limit=100')).body as PlayerListBody;
    expect(v23.meta.total).toBe(12);
    expect(v15.meta.total).toBe(20);
  });

  it('combina filtros: genero femenino y version 23', async () => {
    const res = (await list('?gender=female&fifaVersion=23&limit=100'))
      .body as PlayerListBody;
    expect(res.meta.total).toBe(12);

    const none = (await list('?gender=male&fifaVersion=23&limit=100'))
      .body as PlayerListBody;
    expect(none.meta.total).toBe(0);
  });

  it('filtra por nombre sin distinguir mayusculas', async () => {
    const res = (await list('?name=kerr&limit=100')).body as PlayerListBody;
    expect(res.meta.total).toBe(1);
    expect(res.data[0].name.toLowerCase()).toContain('kerr');
  });

  it('filtra por club', async () => {
    const res = (await list('?club=barcelona&limit=100')).body as PlayerListBody;
    expect(res.meta.total).toBeGreaterThanOrEqual(1);
    res.data.forEach((p) => expect(p.club.toLowerCase()).toContain('barcelona'));
  });

  it('filtra por nacionalidad', async () => {
    const res = (await list('?nationality=argentina&limit=100'))
      .body as PlayerListBody;
    expect(res.meta.total).toBeGreaterThanOrEqual(1);
    res.data.forEach((p) => expect(p.nationality.toLowerCase()).toContain('argentina'));
  });

  it('un filtro sin resultados responde 200 con data vacio', () => {
    return list('?name=zzz_no_existe')
      .expect(200)
      .expect((res) => {
        const body = res.body as PlayerListBody;
        expect(body.data).toEqual([]);
        expect(body.meta.total).toBe(0);
        expect(body.meta.totalPages).toBe(0);
      });
  });

  it('page=0 responde 400', () => {
    return list('?page=0').expect(400);
  });

  it('limit no numerico responde 400', () => {
    return list('?limit=abc').expect(400);
  });

  it('limit mayor a 100 responde 400', () => {
    return list('?limit=1000').expect(400);
  });

  it('genero fuera de la lista responde 400', () => {
    return list('?gender=otro').expect(400);
  });

  it('parametro desconocido responde 400', () => {
    return list('?foo=bar').expect(400);
  });
});