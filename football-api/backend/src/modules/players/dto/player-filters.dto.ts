import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PlayerGender } from '../entities/player.entity';

// Filtros comunes al listado paginado y a la exportacion CSV.
export class PlayerFiltersDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  club?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @IsOptional()
  @IsIn(['male', 'female', 'not_specified'])
  gender?: PlayerGender;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fifaVersion?: number;
}
