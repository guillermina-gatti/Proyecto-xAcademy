import { Readable } from 'stream';
import { parse } from 'csv-parse';

export type Gender = 'male' | 'female';

// Una fila lista para guardar. Las claves son los atributos del modelo PlayerModel.
export type PlayerRow = Record<string, string | number | null>;

// Columnas numéricas del CSV de FIFA, con el atributo del modelo.
const NUMERIC_COLUMNS: Record<string, string> = {
  value_eur: 'valueEur',
  wage_eur: 'wageEur',
  height_cm: 'heightCm',
  weight_kg: 'weightKg',
  weak_foot: 'weakFoot',
  skill_moves: 'skillMoves',
  international_reputation: 'internationalReputation',
  pace: 'pace',
  shooting: 'shooting',
  passing: 'passing',
  dribbling: 'dribbling',
  defending: 'defending',
  physic: 'physic',
  attacking_crossing: 'attackingCrossing',
  attacking_finishing: 'attackingFinishing',
  attacking_heading_accuracy: 'attackingHeadingAccuracy',
  attacking_short_passing: 'attackingShortPassing',
  attacking_volleys: 'attackingVolleys',
  skill_dribbling: 'skillDribbling',
  skill_curve: 'skillCurve',
  skill_fk_accuracy: 'skillFkAccuracy',
  skill_long_passing: 'skillLongPassing',
  skill_ball_control: 'skillBallControl',
  movement_acceleration: 'movementAcceleration',
  movement_sprint_speed: 'movementSprintSpeed',
  movement_agility: 'movementAgility',
  movement_reactions: 'movementReactions',
  movement_balance: 'movementBalance',
  power_shot_power: 'powerShotPower',
  power_jumping: 'powerJumping',
  power_stamina: 'powerStamina',
  power_strength: 'powerStrength',
  power_long_shots: 'powerLongShots',
  mentality_aggression: 'mentalityAggression',
  mentality_interceptions: 'mentalityInterceptions',
  mentality_positioning: 'mentalityPositioning',
  mentality_vision: 'mentalityVision',
  mentality_penalties: 'mentalityPenalties',
  mentality_composure: 'mentalityComposure',
  defending_marking_awareness: 'defendingMarking',
  defending_standing_tackle: 'defendingStandingTackle',
  defending_sliding_tackle: 'defendingSlidingTackle',
  goalkeeping_diving: 'goalkeepingDiving',
  goalkeeping_handling: 'goalkeepingHandling',
  goalkeeping_kicking: 'goalkeepingKicking',
  goalkeeping_positioning: 'goalkeepingPositioning',
  goalkeeping_reflexes: 'goalkeepingReflexes',
  goalkeeping_speed: 'goalkeepingSpeed',
};

// Columnas de texto del CSV, con el atributo del modelo.
const TEXT_COLUMNS: Record<string, string> = {
  club_name: 'clubName',
  nationality_name: 'nationalityName',
  preferred_foot: 'preferredFoot',
  work_rate: 'workRate',
  body_type: 'bodyType',
  player_traits: 'playerTraits',
};

// Algunos textos llegan como UTF-8 leído como latin1 ("AndrÃ©s" en lugar de "Andrés").
export function fixMojibake(text: string): string {
  if (!/[ÃÂ]/.test(text)) {
    return text;
  }
  return Buffer.from(text, 'latin1').toString('utf8');
}

function toNumber(value: string | undefined): number | null {
  if (value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed === '') {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function toText(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : fixMojibake(trimmed);
}

// Convierte una fila del CSV en un registro del modelo.
// Devuelve null si falta algún campo obligatorio.
export function toPlayerRow(
  record: Record<string, string>,
  gender: Gender,
): PlayerRow | null {
  const fifaPlayerId = toNumber(record.player_id);
  const fifaVersion = toNumber(record.fifa_version);
  const fifaUpdate = toText(record.fifa_update);
  const longName = toText(record.long_name);
  const playerPositions = toText(record.player_positions);
  const playerFaceUrl = toText(record.player_face_url);
  const overall = toNumber(record.overall);
  const potential = toNumber(record.potential);
  const age = toNumber(record.age);

  if (
    fifaPlayerId === null ||
    fifaVersion === null ||
    fifaUpdate === null ||
    longName === null ||
    playerPositions === null ||
    playerFaceUrl === null ||
    overall === null ||
    potential === null ||
    age === null
  ) {
    return null;
  }

  const row: PlayerRow = {
    fifaPlayerId,
    fifaVersion,
    fifaUpdate,
    gender,
    longName,
    playerPositions,
    playerFaceUrl,
    overall,
    potential,
    age,
  };

  for (const [column, attribute] of Object.entries(NUMERIC_COLUMNS)) {
    row[attribute] = toNumber(record[column]);
  }
  for (const [column, attribute] of Object.entries(TEXT_COLUMNS)) {
    row[attribute] = toText(record[column]);
  }

  return row;
}

// Lee un CSV en streaming y devuelve cada fila como objeto (cabecera -> valor).
export async function* readCsvRecords(
  input: Readable,
): AsyncGenerator<Record<string, string>> {
  const parser = input.pipe(
    parse({
      columns: true,
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
    }),
  );
  for await (const record of parser) {
    yield record as Record<string, string>;
  }
}

// Identidad de una fila: (fifa_player_id, fifa_version, gender).
export function identityKey(row: PlayerRow): string {
  return `${row.fifaPlayerId}-${row.fifaVersion}-${row.gender}`;
}

// Se queda con la fila de fifa_update más reciente para cada identidad.
export function isNewerUpdate(
  candidate: PlayerRow,
  current: PlayerRow,
): boolean {
  return Number(candidate.fifaUpdate) > Number(current.fifaUpdate);
}
