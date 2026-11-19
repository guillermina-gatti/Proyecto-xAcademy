// backend/config/config.js
// Configuracion para sequelize-cli (migraciones).
// La app usa src/config/sequelize.config.ts; este archivo es solo para la CLI.
require('dotenv').config();

const dbConfig = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    dialectOptions: { charset: 'utf8mb4' },
    logging: false,
};

module.exports = {
    development: dbConfig,
    production: dbConfig,
};