'use strict';

// Cambios de esquema para la tabla players:
// - fifa_version pasa de VARCHAR a INT.
// - gender ENUM('male','female','not_specified').
// - fifa_player_id INT, rellenado desde player_face_url por lotes.

const { fifaPlayerIdFromFaceUrl } = require('./lib/fifa-player-id');

const BATCH_SIZE = 1000;

module.exports = {
    async up(queryInterface) {
        const sequelize = queryInterface.sequelize;

        // Convierte '15', '16', ... a 15, 16, ... (MySQL convierte los strings numericos).
        await sequelize.query(
            'ALTER TABLE `players` MODIFY `fifa_version` INT NOT NULL;',
        );

        await sequelize.query(
            "ALTER TABLE `players` ADD COLUMN `gender` ENUM('male','female','not_specified') NOT NULL DEFAULT 'male';",
        );

        await sequelize.query(
            'ALTER TABLE `players` ADD COLUMN `fifa_player_id` INT NULL;',
        );

        // Backfill por lotes desde player_face_url.
        let lastId = 0;
        for (; ;) {
            const [rows] = await sequelize.query(
                'SELECT `id`, `player_face_url` FROM `players` WHERE `id` > ? ORDER BY `id` LIMIT ?;',
                { replacements: [lastId, BATCH_SIZE] },
            );
            if (rows.length === 0) break;

            const updates = rows
                .map((r) => ({ id: r.id, fifaPlayerId: fifaPlayerIdFromFaceUrl(r.player_face_url) }))
                .filter((u) => u.fifaPlayerId !== null);

            if (updates.length > 0) {
                const cases = updates.map(() => 'WHEN ? THEN ?').join(' ');
                const ids = updates.map(() => '?').join(',');
                const replacements = [
                    ...updates.flatMap((u) => [u.id, u.fifaPlayerId]),
                    ...updates.map((u) => u.id),
                ];
                await sequelize.query(
                    `UPDATE \`players\` SET \`fifa_player_id\` = CASE \`id\` ${cases} END WHERE \`id\` IN (${ids});`,
                    { replacements },
                );
            }

            lastId = rows[rows.length - 1].id;
        }

        // Si quedo algun jugador sin fifa_player_id, no seguir: la clave unica lo necesita.
        const [[{ missing }]] = await sequelize.query(
            'SELECT COUNT(*) AS missing FROM `players` WHERE `fifa_player_id` IS NULL;',
        );
        if (Number(missing) > 0) {
            throw new Error(
                `${missing} jugadores sin fifa_player_id: revisar player_face_url antes de seguir.`,
            );
        }

        await sequelize.query(
            'ALTER TABLE `players` MODIFY `fifa_player_id` INT NOT NULL;',
        );
    },

    async down(queryInterface) {
        const sequelize = queryInterface.sequelize;
        await sequelize.query('ALTER TABLE `players` DROP COLUMN `fifa_player_id`;');
        await sequelize.query('ALTER TABLE `players` DROP COLUMN `gender`;');
        await sequelize.query(
            'ALTER TABLE `players` MODIFY `fifa_version` VARCHAR(255) NOT NULL;',
        );
    },
};