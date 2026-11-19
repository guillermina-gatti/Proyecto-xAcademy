import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

// Edicion parcial: solo se valida y modifica lo que llega en el body.
// ValidateIf hace que los campos que no pueden quedar vacios rechacen null.
// club y nationality si aceptan null (dejan el campo sin valor).
const isPresent = (_object: object, value: unknown): boolean =>
  value !== undefined;

export class UpdatePlayerDto {
  @ValidateIf(isPresent)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ValidateIf(isPresent)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  club?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string | null;

  @ValidateIf(isPresent)
  @IsInt()
  @Min(0)
  @Max(99)
  rating?: number;

  @ValidateIf(isPresent)
  @IsInt()
  @Min(0)
  @Max(99)
  speed?: number;

  @ValidateIf(isPresent)
  @IsInt()
  @Min(0)
  @Max(99)
  shooting?: number;

  @ValidateIf(isPresent)
  @IsInt()
  @Min(0)
  @Max(99)
  passing?: number;

  @ValidateIf(isPresent)
  @IsInt()
  @Min(0)
  @Max(99)
  dribbling?: number;

  @ValidateIf(isPresent)
  @IsInt()
  @Min(0)
  @Max(99)
  defending?: number;

  @ValidateIf(isPresent)
  @IsInt()
  @Min(0)
  @Max(99)
  physic?: number;
}
