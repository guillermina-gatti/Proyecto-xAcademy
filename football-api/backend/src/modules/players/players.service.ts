import { Inject, Injectable } from '@nestjs/common';
import {
  IPlayerRepository,
  PlayerListParams,
} from './interfaces/player-repository.interface';
import { Player } from './entities/player.entity';
import { PlayerDto } from './dto/player.dto';
import { PlayerListResponse } from './dto/player-list.response';

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
}