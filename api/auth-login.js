import { getDatabase, json } from './_db.js';
import { getPlayerRole } from './access-control.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed' });
  const login = typeof request.body?.login === 'string' ? request.body.login.trim() : '';
  const password = typeof request.body?.password === 'string' ? request.body.password : '';
  if (!login || !password || login.length > 32 || password.length > 128) {
    return json(response, 400, { error: 'Введіть логін і пароль' });
  }
  try {
    const db = getDatabase();
    const [rows] = await db.query(
      `SELECT id, nickname, login, password, email, level, exp, online, money, donate,
              premium_time_left, premium_total, premium_transactions, premium_last_date,
              donate_total, donate_transactions, donate_last_date,
              health, calories, armor, quests, BattlePass, phone, phone_balance,
              start_city, hometown, gender, skin, car_slots, social_rating,
              faction_id, faction_level, faction_exp, faction_warns,
              clan_id, clan_exp, clan_rank, clan_role, job_class, job_id,
              military_level, military_exp, subscription_time_left, subscription_total,
              subscription_transactions, subscription_last_date, business_coins, cinema_balance,
              playing_time, reg_date, last_date, last_enter_date, birthday, sessions_counter,
              (SELECT COUNT(*) FROM ugta_apartments a WHERE a.user_id = ugta_players.id) housing_count,
              (SELECT GROUP_CONCAT(a.number ORDER BY a.number SEPARATOR ', ') FROM ugta_apartments a WHERE a.user_id = ugta_players.id) housing_numbers,
              (SELECT COUNT(*) FROM ugta_vehicles v WHERE v.owner_pid = CAST(ugta_players.id AS CHAR) AND (v.deleted IS NULL OR v.deleted = 0)) vehicles_count,
              banned
       FROM ugta_players WHERE login = ? LIMIT 1`,
      [login],
    );
    const player = rows[0];
    if (!player || player.banned || player.password !== password) {
      return json(response, 401, { error: 'Неправильний логін або пароль' });
    }
    const [[vehicles], [apartments]] = await Promise.all([
      db.query('SELECT id, model, health, fuel, mileage, number_plate, creation_date FROM ugta_vehicles WHERE owner_pid=? AND (deleted IS NULL OR deleted=0) ORDER BY id', [String(player.id)]),
      db.query('SELECT id, number, meter_type, sale_state, paid_days, time_to_pay, paid_upgrade FROM ugta_apartments WHERE user_id=? ORDER BY number', [player.id]),
    ]);
    player.vehicles = vehicles;
    player.apartments = apartments;
    player.role = await getPlayerRole(db, player.id);
    const { password: _password, ...safePlayer } = player;
    return json(response, 200, { player: safePlayer });
  } catch (error) {
    console.error('auth API failed', error);
    return json(response, 503, { error: 'Авторизація тимчасово недоступна' });
  }
}
