import { Player } from '../entities/player.entity';

export interface PlayerListParams {
  page: number;
  limit: number;
  name?: string;
  club?: string;
  position?: string;
  nationality?: string;
  gender?: 'male' | 'female' | 'not_specified';
  fifaVersion?: number;
}

export interface PlayerListResult {
  rows: Player[];
  total: number;
}

export interface IPlayerRepository {
  findAll(): Promise<Player[]>;
  findOneById(id: number): Promise<Player | undefined>;
  findPaginated(params: PlayerListParams): Promise<PlayerListResult>;
}