import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PlayerGender } from '../entities/player.entity';

// Alta de un jugador creado por el usuario.
// El servidor asigna fifa_version = 0 y un fifa_player_id desde 900001.
export class CreatePlayerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  position: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  club?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @IsOptional()
  @IsIn(['male', 'female', 'not_specified'])
  gender?: PlayerGender;

  @IsInt()
  @Min(0)
  @Max(99)
  rating: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  speed?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  shooting?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  passing?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  dribbling?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  defending?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  physic?: number;
}
