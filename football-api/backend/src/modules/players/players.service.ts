import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IPlayerRepository,
  PlayerFilters,
  PlayerListParams,
} from './interfaces/player-repository.interface';
import { Player } from './entities/player.entity';
import { PlayerDto } from './dto/player.dto';
import { PlayerListResponse } from './dto/player-list.response';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @Inject('IPlayerRepository')
    private readonly playerRepository: IPlayerRepository,
  ) {}

  getPlayerById(id: number): Promise<Player | undefined> {
    return this.playerRepository.findOneById(id);
  }

  async getPlayers(params: PlayerListParams): Promise<PlayerListResponse> {
    const { rows, total } = await this.playerRepository.findPaginated(params);
    return {
      data: rows.map((player) => new PlayerDto(player)),
      meta: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  // Entrega los jugadores filtrados en lotes, para no cargar toda la tabla.
  async *iterateFiltered(
    filters: PlayerFilters,
    batchSize = 1000,
  ): AsyncGenerator<Player[]> {
    let afterId = 0;
    for (;;) {
      const batch = await this.playerRepository.findBatchAfter(
        filters,
        afterId,
        batchSize,
      );
      if (batch.length === 0) {
        return;
      }
      yield batch;
      afterId = batch[batch.length - 1].id;
    }
  }

  async createPlayer(data: CreatePlayerDto): Promise<Player> {
    // El servidor asigna el fifa_player_id: 900001 y los siguientes.
    const fifaPlayerId = await this.playerRepository.nextUserFifaPlayerId();
    return this.playerRepository.create(data, fifaPlayerId);
  }

  async updatePlayer(id: number, data: UpdatePlayerDto): Promise<Player> {
    const player = await this.playerRepository.update(id, data);
    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found.`);
    }
    return player;
  }
}
