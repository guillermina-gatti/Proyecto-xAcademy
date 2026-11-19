import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { PlayerModel } from './player.model'; // Sequelize model
import {
  IPlayerRepository,
  PlayerListParams,
  PlayerListResult,
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
    console.log('Mapping PlayerModel to Player entity:', model);
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
    player.dribbling = model.dribbling ?? 0;
    player.passing = model.passing ?? 0;

    return player;
  }
}
