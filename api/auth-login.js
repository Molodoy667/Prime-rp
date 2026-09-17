import { getDatabase, json } from './_db.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
  const login = typeof request.body?.login === 'string' ? request.body.login.trim() : '';
  const password = typeof request.body?.password === 'string' ? request.body.password : '';
  if (!login || !password || login.length > 32 || password.length > 128) {
    return json(response, 400, { error: 'Введите логин и пароль' });
  }
  try {
    const [rows] = await getDatabase().query(
      `SELECT id, nickname, login, password, email, level, exp, online, money, donate,
              premium_time_left, faction_id, faction_level, playing_time, reg_date, banned
       FROM ugta_players WHERE login = ? LIMIT 1`,
      [login],
    );
    const player = rows[0];
    if (!player || player.banned || player.password !== password) {
      return json(response, 401, { error: 'Неверный логин или пароль' });
    }
    const { password: _password, ...safePlayer } = player;
    return json(response, 200, { player: safePlayer });
  } catch (error) {
    console.error('auth API failed', error);
    return json(response, 503, { error: 'Авторизация временно недоступна' });
  }
}
