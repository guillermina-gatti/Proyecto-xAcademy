import { createReadStream } from 'fs';
import { join } from 'path';
import {
  Gender,
  PlayerRow,
  fixMojibake,
  isNewerUpdate,
  readCsvRecords,
  toPlayerRow,
} from './csv-player-parser';

const FIXTURES = join(__dirname, '..', '..', '..', 'test', 'fixtures');

async function readFixture(name: string): Promise<Record<string, string>[]> {
  const records: Record<string, string>[] = [];
  const input = createReadStream(join(FIXTURES, name), { encoding: 'utf8' });
  for await (const record of readCsvRecords(input)) {
    records.push(record);
  }
  return records;
}

function toRows(
  records: Record<string, string>[],
  gender: Gender,
): PlayerRow[] {
  return records
    .map((record) => toPlayerRow(record, gender))
    .filter((row): row is PlayerRow => row !== null);
}

function playerRecord(
  overrides: Record<string, string>,
): Record<string, string> {
  return {
    player_id: '227125',
    fifa_version: '23',
    fifa_update: '9',
    long_name: 'Samantha May Kerr',
    player_positions: 'ST',
    player_face_url: 'https://cdn.sofifa.net/players/227/125/23_120.png',
    overall: '91',
    potential: '91',
    age: '28',
    ...overrides,
  };
}

describe('csv-player-parser', () => {
  it('convierte el fixture masculino y guarda a Messi con su identidad', async () => {
    const rows = toRows(await readFixture('male_players_fixture.csv'), 'male');

    expect(rows).toHaveLength(20);
    const messi = rows[0];
    expect(messi.fifaPlayerId).toBe(158023);
    expect(messi.fifaVersion).toBe(15);
    expect(messi.gender).toBe('male');
    expect(messi.longName).toBe('Lionel Andrés Messi Cuccittini');
    expect(messi.pace).toBe(93);
  });

  it('convierte el fixture femenino y deja en null las columnas vacías', async () => {
    const rows = toRows(
      await readFixture('female_players_fixture.csv'),
      'female',
    );

    expect(rows).toHaveLength(20);
    const morgan = rows.find((row) => row.fifaPlayerId === 226301);
    expect(morgan).toBeDefined();
    expect(morgan?.clubName).toBeNull();
    expect(morgan?.valueEur).toBeNull();
  });

  it('descarta filas sin campos obligatorios', () => {
    const row = toPlayerRow(playerRecord({ long_name: '' }), 'female');
    expect(row).toBeNull();
  });

  it('corrige el mojibake de los nombres', () => {
    expect(fixMojibake('AndrÃ©s')).toBe('Andrés');
    expect(fixMojibake('Andrés')).toBe('Andrés');
  });

  it('compara fifa_update como número', () => {
    const older = toPlayerRow(playerRecord({ fifa_update: '9' }), 'female');
    const newer = toPlayerRow(playerRecord({ fifa_update: '10' }), 'female');
    expect(older && newer && isNewerUpdate(newer, older)).toBe(true);
    expect(older && newer && isNewerUpdate(older, newer)).toBe(false);
  });
});
