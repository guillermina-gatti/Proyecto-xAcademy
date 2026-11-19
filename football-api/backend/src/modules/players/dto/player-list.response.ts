import { PlayerDto } from './player.dto';

export interface PlayerListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PlayerListResponse {
  data: PlayerDto[];
  meta: PlayerListMeta;
}