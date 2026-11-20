import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { Sequelize } from 'sequelize-typescript';
import { PlayerModel } from '../modules/players/repositories/sequelize/player.model';
import { importPlayers } from '../modules/import/import-players';

dotenv.config();

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main(): Promise<void> {
  const file = readArg('file');
  const gender = readArg('gender');

  if (!file || (gender !== 'male' && gender !== 'female')) {
    console.error(
      'Uso: npm run import:csv -- --file <ruta> --gender male|female',
    );
    process.exit(1);
  }
  if (!existsSync(file)) {
    console.error(`No existe el archivo: ${file}`);
    process.exit(1);
  }

  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'test',
    dialectOptions: { charset: 'utf8mb4' },
    models: [PlayerModel],
    logging: false,
  });

  await sequelize.authenticate();
  const summary = await importPlayers(file, gender);
  console.log(`Importación de ${gender} terminada:`, summary);
  await sequelize.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
