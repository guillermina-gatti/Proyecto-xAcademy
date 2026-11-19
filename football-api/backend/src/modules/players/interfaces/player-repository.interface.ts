import { Player, PlayerGender } from '../entities/player.entity';

export interface PlayerListParams {
  page: number;
  limit: number;
  name?: string;
  club?: string;
  position?: string;
  nationality?: string;
  gender?: PlayerGender;
  fifaVersion?: number;
}

export interface PlayerListResult {
  rows: Player[];
  total: number;
}

// Datos que se pueden escribir. En una edicion, undefined significa "no tocar".
export interface PlayerWriteData {
  name?: string;
  position?: string;
  club?: string | null;
  nationality?: string | null;
  gender?: PlayerGender;
  rating?: number;
  speed?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physic?: number;
}

export interface PlayerCreateData extends PlayerWriteData {
  name: string;
  position: string;
  rating: number;
}

export interface IPlayerRepository {
  findAll(): Promise<Player[]>;
  findOneById(id: number): Promise<Player | undefined>;
  findPaginated(params: PlayerListParams): Promise<PlayerListResult>;
  create(data: PlayerCreateData, fifaPlayerId: number): Promise<Player>;
  update(id: number, data: PlayerWriteData): Promise<Player | undefined>;
  nextUserFifaPlayerId(): Promise<number>;
}
