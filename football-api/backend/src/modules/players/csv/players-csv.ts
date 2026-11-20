import { Player } from '../entities/player.entity';

// BOM UTF-8: hace que Excel lea bien las tildes y la eñe.
export const CSV_BOM = '\uFEFF';

const COLUMNS: (keyof Player)[] = [
  'id',
  'name',
  'club',
  'position',
  'nationality',
  'gender',
  'fifaVersion',
  'fifaPlayerId',
  'rating',
  'speed',
  'shooting',
  'passing',
  'dribbling',
  'defending',
  'physic',
];

export function playersCsvHeader(): string {
  return COLUMNS.join(',');
}

export function playerToCsvLine(player: Player): string {
  return COLUMNS.map((column) => escapeCsvValue(player[column])).join(',');
}

// Escapa comas, comillas y saltos de linea. Los textos que empiezan con
// =, +, - o @ se prefijan con una comilla simple para que Excel no los
// ejecute como formulas.
export function escapeCsvValue(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return '';
  }
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  if (/[",\r\n]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}
