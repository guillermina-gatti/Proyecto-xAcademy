import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { authenticateRequests, setTestAuthEnv } from './helpers/auth';
import { PlayerModel } from '../src/modules/players/repositories/sequelize/player.model';

// Requiere la base cargada con los fixtures (Messi: id 1, fifa_player_id 158023).
// Corre con --runInBand: los POST insertan filas y los tests de listado cuentan 32.
interface PlayerBody {
  id: number;
  name: string;
  club: string;
  position: string;
  nationality: string;
  gender: string;
  fifaVersion: number;
  fifaPlayerId: number;
  rating: number;
  speed: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physic: number;
}

setTestAuthEnv();

describe('Players write (e2e)', () => {
  let app: INestApplication<App>;
  let createdId: number;
  let createdFifaPlayerId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    authenticateRequests(moduleFixture, app);
    await app.init();
  });

  afterAll(async () => {
    // Borra los jugadores creados por estos tests (fifa_version = 0).
    const model = app.get<typeof PlayerModel>(getModelToken(PlayerModel));
    await model.destroy({ where: { fifaVersion: 0 } });
    await app.close();
  });

  const server = () => app.getHttpServer();

  describe('GET /api/players/:id (detalle)', () => {
    it('devuelve los campos del jugador, incluidos gender y fifaPlayerId', () => {
      return request(server())
        .get('/api/players/1')
        .expect(200)
        .expect((res) => {
          const body = res.body as PlayerBody;
          expect(body.name).toContain('Messi');
          expect(body.fifaPlayerId).toBe(158023);
          expect(body.gender).toBe('male');
          expect(body.speed).toEqual(expect.any(Number));
          expect(body.defending).toEqual(expect.any(Number));
        });
    });
  });

  describe('POST /api/players (alta)', () => {
    it('crea un jugador con fifa_version 0 y fifa_player_id desde 900001', () => {
      return request(server())
        .post('/api/players')
        .send({
          name: 'Jugador de Prueba',
          position: 'ST',
          club: 'Club de Prueba',
          nationality: 'Argentina',
          gender: 'female',
          rating: 80,
          speed: 90,
          shooting: 85,
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as PlayerBody;
          expect(body.name).toBe('Jugador de Prueba');
          expect(body.fifaVersion).toBe(0);
          expect(body.fifaPlayerId).toBeGreaterThanOrEqual(900001);
          expect(body.gender).toBe('female');
          expect(body.rating).toBe(80);
          expect(body.passing).toBe(0);
          createdId = body.id;
          createdFifaPlayerId = body.fifaPlayerId;
        });
    });

    it('el siguiente jugador recibe el siguiente fifa_player_id y gender por defecto', () => {
      return request(server())
        .post('/api/players')
        .send({ name: 'Segundo Jugador', position: 'CB', rating: 60 })
        .expect(201)
        .expect((res) => {
          const body = res.body as PlayerBody;
          expect(body.fifaPlayerId).toBe(createdFifaPlayerId + 1);
          expect(body.gender).toBe('not_specified');
        });
    });

    it('nombre vacio responde 400', () => {
      return request(server())
        .post('/api/players')
        .send({ name: '', position: 'ST', rating: 70 })
        .expect(400);
    });

    it('una skill mayor a 99 responde 400', () => {
      return request(server())
        .post('/api/players')
        .send({ name: 'Skill Alta', position: 'ST', rating: 70, speed: 100 })
        .expect(400);
    });

    it('genero fuera del enum responde 400', () => {
      return request(server())
        .post('/api/players')
        .send({
          name: 'Genero Malo',
          position: 'ST',
          rating: 70,
          gender: 'otro',
        })
        .expect(400);
    });

    it('sin rating responde 400', () => {
      return request(server())
        .post('/api/players')
        .send({ name: 'Sin Rating', position: 'ST' })
        .expect(400);
    });

    it('campo no permitido responde 400', () => {
      return request(server())
        .post('/api/players')
        .send({ name: 'Campo Extra', position: 'ST', rating: 70, foo: 'bar' })
        .expect(400);
    });
  });

  describe('PATCH /api/players/:id (edicion parcial)', () => {
    it('modifica solo los campos enviados y responde 200', () => {
      return request(server())
        .patch(`/api/players/${createdId}`)
        .send({ rating: 85, club: 'Club Nuevo' })
        .expect(200)
        .expect((res) => {
          const body = res.body as PlayerBody;
          expect(body.rating).toBe(85);
          expect(body.club).toBe('Club Nuevo');
          expect(body.name).toBe('Jugador de Prueba');
          expect(body.gender).toBe('female');
        });
    });

    it('persiste el cambio: el detalle devuelve el valor nuevo', () => {
      return request(server())
        .get(`/api/players/${createdId}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as PlayerBody;
          expect(body.rating).toBe(85);
          expect(body.club).toBe('Club Nuevo');
        });
    });

    it('club en null deja el campo sin valor', () => {
      return request(server())
        .patch(`/api/players/${createdId}`)
        .send({ club: null })
        .expect(200)
        .expect((res) => {
          const body = res.body as PlayerBody;
          expect(body.club).toBe('Unknown Club');
        });
    });

    it('id inexistente responde 404', () => {
      return request(server())
        .patch('/api/players/999999')
        .send({ rating: 50 })
        .expect(404);
    });

    it('campo inexistente responde 400', () => {
      return request(server())
        .patch(`/api/players/${createdId}`)
        .send({ foo: 'bar' })
        .expect(400);
    });

    it('el genero no se edita desde PATCH y responde 400', () => {
      return request(server())
        .patch(`/api/players/${createdId}`)
        .send({ gender: 'male' })
        .expect(400);
    });

    it('skill fuera de rango responde 400', () => {
      return request(server())
        .patch(`/api/players/${createdId}`)
        .send({ rating: 150 })
        .expect(400);
    });

    it('nombre en null responde 400', () => {
      return request(server())
        .patch(`/api/players/${createdId}`)
        .send({ name: null })
        .expect(400);
    });
  });
});
