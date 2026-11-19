import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { PlayerModel } from './player.model'; // Sequelize model
import {
  IPlayerRepository,
  PlayerCreateData,
  PlayerListParams,
  PlayerListResult,
  PlayerWriteData,
} from '../../interfaces/player-repository.interface';
import { Player } from '../../entities/player.entity';

@Injectable()
export class SequelizePlayerRepository implements IPlayerRepository {
  constructor(
    @InjectModel(PlayerModel)
    private readonly playerModel: typeof PlayerModel,
  ) {}

  async findAll(): Promise<Player[]> {
    const playerList = await this.playerModel.findAll();
    return playerList.map((x) => this.mapToEntity(x));
  }

  async findOneById(id: number): Promise<Player | undefined> {
    const model = await this.playerModel.findByPk(id);
    if (!model) {
      return undefined;
    }
    return this.mapToEntity(model);
  }

  async findPaginated(params: PlayerListParams): Promise<PlayerListResult> {
    const { rows, count } = await this.playerModel.findAndCountAll({
      where: this.buildWhere(params),
      // Orden estable: sin esto, dos paginas pueden repetir o perder jugadores.
      order: [['id', 'ASC']],
      limit: params.limit,
      offset: (params.page - 1) * params.limit,
    });
    return { rows: rows.map((x) => this.mapToEntity(x)), total: count };
  }

  async create(data: PlayerCreateData, fifaPlayerId: number): Promise<Player> {
    const values: Partial<PlayerModel> = {
      fifaVersion: 0,
      fifaPlayerId,
      gender: data.gender ?? 'not_specified',
      fifaUpdate: '0',
      playerFaceUrl: '',
      longName: data.name,
      playerPositions: data.position,
      clubName: data.club ?? null,
      nationalityName: data.nationality ?? null,
      overall: data.rating,
      potential: data.rating,
      age: 0,
      pace: data.speed ?? 0,
      shooting: data.shooting ?? 0,
      passing: data.passing ?? 0,
      dribbling: data.dribbling ?? 0,
      defending: data.defending ?? 0,
      physic: data.physic ?? 0,
    };
    const model = await this.playerModel.create(values as PlayerModel);
    return this.mapToEntity(model);
  }

  async update(id: number, data: PlayerWriteData): Promise<Player | undefined> {
    const model = await this.playerModel.findByPk(id);
    if (!model) {
      return undefined;
    }

    // Solo se escriben los campos que llegaron en el body.
    const changes: Partial<PlayerModel> = {};
    if (data.name !== undefined) changes.longName = data.name;
    if (data.position !== undefined) changes.playerPositions = data.position;
    if (data.club !== undefined) changes.clubName = data.club;
    if (data.nationality !== undefined) {
      changes.nationalityName = data.nationality;
    }
    if (data.rating !== undefined) changes.overall = data.rating;
    if (data.speed !== undefined) changes.pace = data.speed;
    if (data.shooting !== undefined) changes.shooting = data.shooting;
    if (data.passing !== undefined) changes.passing = data.passing;
    if (data.dribbling !== undefined) changes.dribbling = data.dribbling;
    if (data.defending !== undefined) changes.defending = data.defending;
    if (data.physic !== undefined) changes.physic = data.physic;

    await model.update(changes);
    return this.mapToEntity(model);
  }

  async nextUserFifaPlayerId(): Promise<number> {
    const last = await this.playerModel.findOne({
      where: { fifaVersion: 0 },
      order: [['fifaPlayerId', 'DESC']],
      attributes: ['fifaPlayerId'],
    });
    return last ? last.fifaPlayerId + 1 : 900001;
  }

  private buildWhere(params: PlayerListParams): WhereOptions<PlayerModel> {
    const conditions: WhereOptions<PlayerModel>[] = [];

    if (params.name) {
      conditions.push({ longName: { [Op.like]: `%${params.name}%` } });
    }
    if (params.club) {
      conditions.push({ clubName: { [Op.like]: `%${params.club}%` } });
    }
    if (params.position) {
      conditions.push({
        playerPositions: { [Op.like]: `%${params.position}%` },
      });
    }
    if (params.nationality) {
      conditions.push({
        nationalityName: { [Op.like]: `%${params.nationality}%` },
      });
    }
    if (params.gender) {
      conditions.push({ gender: params.gender });
    }
    if (params.fifaVersion !== undefined) {
      conditions.push({ fifaVersion: params.fifaVersion });
    }

    return conditions.length > 0 ? { [Op.and]: conditions } : {};
  }

  private mapToEntity(model: PlayerModel): Player {
    if (!model) {
      throw new Error('Attempted to map null model to Player entity');
    }
    const player = new Player();
    player.id = model.id;
    player.name = model.longName;
    player.club = model.clubName || 'Unknown Club';
    player.position = model.playerPositions?.split(',')[0].trim() ?? 'Unknown';
    player.nationality = model.nationalityName || 'Unknown Nationality';
    player.rating = model.overall;
    player.speed = model.pace ?? 0;
    player.shooting = model.shooting ?? 0;
    player.passing = model.passing ?? 0;
    player.dribbling = model.dribbling ?? 0;
    player.defending = model.defending ?? 0;
    player.physic = model.physic ?? 0;
    player.gender = model.gender;
    player.fifaVersion = model.fifaVersion;
    player.fifaPlayerId = model.fifaPlayerId;
    player.fifaUpdate = model.fifaUpdate;
    player.playerFaceUrl = model.playerFaceUrl;
    player.age = model.age;
    player.potential = model.potential;
    player.valueEur = model.valueEur ?? null;
    player.wageEur = model.wageEur ?? null;
    player.heightCm = model.heightCm ?? null;
    player.weightKg = model.weightKg ?? null;
    player.preferredFoot = model.preferredFoot ?? null;
    player.weakFoot = model.weakFoot ?? null;
    player.skillMoves = model.skillMoves ?? null;
    player.workRate = model.workRate ?? null;
    player.bodyType = model.bodyType ?? null;

    return player;
  }
}
