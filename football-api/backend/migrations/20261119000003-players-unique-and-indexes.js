'use strict';

// Clave unica de identidad de una fila y indices para los filtros del listado.

module.exports = {
    async up(queryInterface) {
        const sequelize = queryInterface.sequelize;

        // La clave unica falla si hay duplicados: se busca antes para dar un mensaje claro.
        const [duplicados] = await sequelize.query(
            'SELECT `fifa_player_id`, `fifa_version`, `gender`, COUNT(*) AS c ' +
            'FROM `players` GROUP BY `fifa_player_id`, `fifa_version`, `gender` ' +
            'HAVING c > 1 LIMIT 10;',
        );
        if (duplicados.length > 0) {
            throw new Error(
                `Hay combinaciones duplicadas de (fifa_player_id, fifa_version, gender). ` +
                `Resolverlas antes de migrar: ${JSON.stringify(duplicados)}`,
            );
        }

        await sequelize.query(
            'ALTER TABLE `players` ADD UNIQUE KEY `uq_players_identity` (`fifa_player_id`, `fifa_version`, `gender`);',
        );
        await sequelize.query(
            'CREATE INDEX `idx_players_long_name` ON `players` (`long_name`);',
        );
        await sequelize.query(
            'CREATE INDEX `idx_players_club_name` ON `players` (`club_name`);',
        );
        await sequelize.query(
            'CREATE INDEX `idx_players_nationality_name` ON `players` (`nationality_name`);',
        );
    },

    async down(queryInterface) {
        const sequelize = queryInterface.sequelize;
        await sequelize.query('DROP INDEX `idx_players_nationality_name` ON `players`;');
        await sequelize.query('DROP INDEX `idx_players_club_name` ON `players`;');
        await sequelize.query('DROP INDEX `idx_players_long_name` ON `players`;');
        await sequelize.query('DROP INDEX `uq_players_identity` ON `players`;');
    },
};