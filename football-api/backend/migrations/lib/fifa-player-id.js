'use strict';

// Extrae el fifa_player_id de la URL de la cara del jugador.
// Patron: /players/200/911/... -> 200911. Devuelve null si no coincide.
function fifaPlayerIdFromFaceUrl(url) {
    if (typeof url !== 'string') return null;
    const match = url.match(/\/players\/(\d{3})\/(\d{3})\//);
    if (!match) return null;
    return parseInt(match[1] + match[2], 10);
}

module.exports = { fifaPlayerIdFromFaceUrl };
