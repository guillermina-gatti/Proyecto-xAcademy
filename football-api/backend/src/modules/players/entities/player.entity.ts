export type PlayerGender = 'male' | 'female' | 'not_specified';

export class Player {
  declare id: number;
  declare name: string;
  declare club: string;
  declare position: string;
  declare nationality: string;
  declare rating: number;
  declare speed: number;
  declare shooting: number;
  declare passing: number;
  declare dribbling: number;
  declare defending: number;
  declare physic: number;
  declare gender: PlayerGender;
  declare fifaVersion: number;
  declare fifaPlayerId: number;
  declare fifaUpdate: string;
  declare playerFaceUrl: string;
  declare age: number;
  declare potential: number;
  declare valueEur: number | null;
  declare wageEur: number | null;
  declare heightCm: number | null;
  declare weightKg: number | null;
  declare preferredFoot: string | null;
  declare weakFoot: number | null;
  declare skillMoves: number | null;
  declare workRate: string | null;
  declare bodyType: string | null;
}
