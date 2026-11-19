// src/config/sequelize.config.ts
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import * as dotenv from 'dotenv';
import { PlayerModel } from 'src/modules/players/repositories/sequelize/player.model';

dotenv.config(); // carga el archivo .env si aún no lo hizo

const sequelizeConfig: SequelizeModuleOptions = {
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',

  // CAMBIO: antes parseInt(..., 3306) daba NaN. El 10 indica base decimal.
  port: parseInt(process.env.DB_PORT || '3306', 10),

  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test',

  // CAMBIO: conexion en UTF-8 completo (tildes, enie, emojis).
  // Va en dialectOptions porque es una opcion del driver mysql2.
  dialectOptions: {
    charset: 'utf8mb4',
  },

  models: [PlayerModel],
  autoLoadModels: true,

  // CAMBIO: antes true. La app ya no modifica la tabla al arrancar.
  // Los cambios de esquema se hacen con migraciones.
  synchronize: false,

  // SIN CAMBIO: false no imprime las consultas SQL en consola.
  logging: false,
};

export default sequelizeConfig;
