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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { once } from 'events';
import { PlayersService } from './players.service';
import { Player } from './entities/player.entity';
import { ListPlayersQueryDto } from './dto/list-players.query';
import { PlayerFiltersDto } from './dto/player-filters.dto';
import { PlayerListResponse } from './dto/player-list.response';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { CSV_BOM, playerToCsvLine, playersCsvHeader } from './csv/players-csv';

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

  // Debe ir antes de @Get(':id'): si no, "export.csv" cae en :id y responde 400.
  @Get('export.csv')
  async exportPlayers(
    @Query() query: PlayerFiltersDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="players.csv"');
    res.write(`${CSV_BOM}${playersCsvHeader()}\n`);

    for await (const batch of this.playersService.iterateFiltered(query)) {
      for (const player of batch) {
        // Si el buffer se llena, espera a que el cliente lo vacie.
        if (!res.write(`${playerToCsvLine(player)}\n`)) {
          await once(res, 'drain');
        }
      }
    }
    res.end();
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
