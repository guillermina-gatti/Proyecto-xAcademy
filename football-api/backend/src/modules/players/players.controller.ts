import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PlayersService } from './players.service';
import { Player } from './entities/player.entity';
import { ListPlayersQueryDto } from './dto/list-players.query';
import { PlayerListResponse } from './dto/player-list.response';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Controller('api/players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  listPlayers(
    @Query() query: ListPlayersQueryDto,
  ): Promise<PlayerListResponse> {
    return this.playersService.getPlayers(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getPlayerById(@Param('id', ParseIntPipe) id: number): Promise<Player> {
    const player = await this.playersService.getPlayerById(id);
    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found.`);
    }
    return player;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createPlayer(@Body() body: CreatePlayerDto): Promise<Player> {
    return this.playersService.createPlayer(body);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updatePlayer(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePlayerDto,
  ): Promise<Player> {
    return this.playersService.updatePlayer(id, body);
  }
}
