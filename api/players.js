import { getDatabase, json } from './_db.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') return json(response, 405, { error: 'Method not allowed' });
  try {
    const limit = Math.min(Math.max(Number(request.query?.limit || 50), 1), 100);
    const offset = Math.max(Number(request.query?.offset || 0), 0);
    const [rows] = await getDatabase().query(
      `SELECT id, nickname, level, exp, online, money, donate, premium_time_left,
              faction_id, faction_level, playing_time, reg_date, last_date, banned
       FROM ugta_players ORDER BY online DESC, last_date DESC LIMIT ? OFFSET ?`,
      [limit, offset],
    );
    return json(response, 200, { players: rows, limit, offset });
  } catch (error) {
    console.error('players API failed', error);
    return json(response, 503, { error: 'Database temporarily unavailable' });
  }
}
