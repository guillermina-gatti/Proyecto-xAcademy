import { createReadStream } from 'fs';
import { PlayerModel } from '../players/repositories/sequelize/player.model';
import {
  Gender,
  PlayerRow,
  identityKey,
  isNewerUpdate,
  readCsvRecords,
  toPlayerRow,
} from './csv-player-parser';

const BATCH_SIZE = 1000;

// Atributos que forman la clave única: no se actualizan en el upsert.
const IDENTITY_ATTRIBUTES = ['fifaPlayerId', 'fifaVersion', 'gender'];

export interface ImportSummary {
  read: number;
  imported: number;
  skipped: number;
}

// Inserta o actualiza un lote. Repetir la importación no duplica filas.
async function upsertBatch(batch: PlayerRow[]): Promise<void> {
  if (batch.length === 0) {
    return;
  }
  const updateOnDuplicate = Object.keys(batch[0]).filter(
    (attribute) => !IDENTITY_ATTRIBUTES.includes(attribute),
  ) as (keyof PlayerModel)[];
  await PlayerModel.bulkCreate(batch as unknown as PlayerModel[], {
    updateOnDuplicate,
  });
}

export async function importPlayers(
  filePath: string,
  gender: Gender,
): Promise<ImportSummary> {
  const summary: ImportSummary = { read: 0, imported: 0, skipped: 0 };
  const input = createReadStream(filePath, { encoding: 'utf8' });

  if (gender === 'female') {
    // El CSV femenino trae varias filas por edición: se guarda solo la más reciente.
    const latest = new Map<string, PlayerRow>();
    for await (const record of readCsvRecords(input)) {
      summary.read++;
      const row = toPlayerRow(record, gender);
      if (!row) {
        summary.skipped++;
        continue;
      }
      const key = identityKey(row);
      const current = latest.get(key);
      if (!current || isNewerUpdate(row, current)) {
        latest.set(key, row);
      }
    }

    const rows = [...latest.values()];
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await upsertBatch(rows.slice(i, i + BATCH_SIZE));
    }
    summary.imported = rows.length;
    return summary;
  }

  let batch: PlayerRow[] = [];
  for await (const record of readCsvRecords(input)) {
    summary.read++;
    const row = toPlayerRow(record, gender);
    if (!row) {
      summary.skipped++;
      continue;
    }
    batch.push(row);
    if (batch.length === BATCH_SIZE) {
      await upsertBatch(batch);
      summary.imported += batch.length;
      batch = [];
    }
  }
  await upsertBatch(batch);
  summary.imported += batch.length;
  return summary;
}
