import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PlayerModel } from '../src/modules/players/repositories/sequelize/player.model';

// Requiere los fixtures: 20 masculinos y 12 femeninos (32 en total).
// Corre con --runInBand junto al resto de los e2e.
const BOM = '\uFEFF';
const HEADER =
  'id,name,club,position,nationality,gender,fifaVersion,fifaPlayerId,rating,speed,shooting,passing,dribbling,defending,physic';

describe('Players export CSV (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    // Borra los jugadores creados por estos tests (fifa_version = 0).
    const model = app.get<typeof PlayerModel>(getModelToken(PlayerModel));
    await model.destroy({ where: { fifaVersion: 0 } });
    await app.close();
  });

  const server = () => app.getHttpServer();
  const exportCsv = (query = '') =>
    request(server()).get(`/api/players/export.csv${query}`);
  const lines = (text: string): string[] =>
    text
      .replace(BOM, '')
      .split('\n')
      .filter((line) => line.length > 0);

  it('responde 200 con cabeceras de descarga CSV', () => {
    return exportCsv()
      .expect(200)
      .expect('Content-Type', /text\/csv/)
      .expect('Content-Disposition', 'attachment; filename="players.csv"');
  });

  it('empieza con BOM UTF-8 y la cabecera de columnas', () => {
    return exportCsv()
      .expect(200)
      .expect((res) => {
        const text = res.text;
        expect(text.startsWith(`${BOM}${HEADER}\n`)).toBe(true);
      });
  });

  it('exporta una fila por jugador, igual que meta.total del listado', async () => {
    const list = await request(server()).get(
      '/api/players?gender=female&limit=100',
    );
    const total = (list.body as { meta: { total: number } }).meta.total;

    const res = await exportCsv('?gender=female').expect(200);
    expect(lines(res.text)).toHaveLength(total + 1);
    expect(total).toBe(12);
  });

  it('exporta todos los jugadores sin filtros', async () => {
    const list = await request(server()).get('/api/players?limit=100');
    const total = (list.body as { meta: { total: number } }).meta.total;

    const res = await exportCsv().expect(200);
    expect(lines(res.text)).toHaveLength(total + 1);
  });

  it('combinacion sin resultados devuelve solo la cabecera', async () => {
    const res = await exportCsv('?gender=male&fifaVersion=23').expect(200);
    expect(lines(res.text)).toEqual([HEADER]);
  });

  it('filtro con valor invalido responde 400', () => {
    return exportCsv('?gender=otro').expect(400);
  });

  it('paginacion no se acepta en la exportacion y responde 400', () => {
    return exportCsv('?page=2').expect(400);
  });

  it('escapa comas y comillas, y neutraliza formulas', async () => {
    await request(server())
      .post('/api/players')
      .send({ name: 'Exportar, "Prueba"', position: 'ST', rating: 70 })
      .expect(201);
    await request(server())
      .post('/api/players')
      .send({ name: '=SUMA(1;1)', position: 'ST', rating: 70 })
      .expect(201);

    const res = await exportCsv('?fifaVersion=0').expect(200);
    const text = res.text;
    expect(text).toContain('"Exportar, ""Prueba"""');
    expect(text).toContain(",'=SUMA(1;1),Unknown Club,");
  });
});
