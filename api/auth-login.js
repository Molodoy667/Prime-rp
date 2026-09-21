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
      `SELECT id, client_id, nickname, login, password, email, level, exp, online, money, donate,
              premium_time_left, premium_total, premium_transactions, premium_last_date,
              donate_total, donate_transactions, donate_last_date,
              health, calories, armor, quests, BattlePass, phone, phone_balance,
              start_city, hometown, gender, skin, car_slots, social_rating,
              faction_id, faction_level, faction_exp, faction_warns,
              clan_id, clan_exp, clan_rank, clan_role, job_class, job_id,
              military_level, military_exp, subscription_time_left, subscription_total,
              subscription_transactions, subscription_last_date, business_coins, cinema_balance,
              playing_time, reg_date, last_date, last_enter_date, birthday, sessions_counter, skins, permanent_data,
              (SELECT COUNT(*) FROM ugta_apartments a WHERE a.user_id = ugta_players.id) +
              (SELECT COUNT(*) FROM ugta_viphouses h WHERE h.owner = ugta_players.id) housing_count,
              CONCAT_WS(', ',
                (SELECT GROUP_CONCAT(a.number ORDER BY a.number SEPARATOR ', ') FROM ugta_apartments a WHERE a.user_id = ugta_players.id),
                (SELECT GROUP_CONCAT(h.hid ORDER BY h.id SEPARATOR ', ') FROM ugta_viphouses h WHERE h.owner = ugta_players.id)
              ) housing_numbers,
              (SELECT COUNT(*) FROM ugta_vehicles v WHERE v.owner_pid = CONCAT('p:', ugta_players.id) AND (v.deleted IS NULL OR v.deleted = 0)) vehicles_count,
              banned
       FROM ugta_players WHERE login = ? LIMIT 1`,
      [login],
    );
    const player = rows[0];
    if (!player || player.banned || player.password !== password) {
      return json(response, 401, { error: 'Неправильний логін або пароль' });
    }
    const [[commonPlayerData]] = await db.query('SELECT permanent_data FROM ugta_players_common WHERE client_id=? LIMIT 1', [player.client_id]);
    // The game stores the active model in ugta_players.skins.s1. The legacy
    // `skin` column can remain the default model, so prefer the runtime value.
    try {
      const rawPermanentData = commonPlayerData?.permanent_data || player.permanent_data;
      const permanentData = typeof rawPermanentData === 'string' ? JSON.parse(rawPermanentData) : rawPermanentData;
      const rawPlayerSkins = player.skins;
      const playerSkins = typeof rawPlayerSkins === 'string' ? JSON.parse(rawPlayerSkins) : rawPlayerSkins;
      const rawPermanentSkins = permanentData?.skins;
      const permanentSkins = typeof rawPermanentSkins === 'string' ? JSON.parse(rawPermanentSkins) : rawPermanentSkins;
      const activeSkin = Number(
        (Array.isArray(playerSkins) ? playerSkins[0] : playerSkins)?.s1 ??
        playerSkins?.s1 ??
        (Array.isArray(permanentSkins) ? permanentSkins[0] : permanentSkins)?.s1 ??
        permanentSkins?.s1 ??
        permanentData?.skin ??
        player.skin,
      );
      if (Number.isInteger(activeSkin) && activeSkin > 0) player.skin = activeSkin;
    } catch {
      // Keep the explicit SQL skin value when permanent_data is empty or invalid.
    }
    // `online` is written by the game on login/logout. If the game process
    // crashes before the logout handler runs, the flag may stay at 1 forever.
    // Treat very old login sessions as offline until the game writes a fresh one.
    const lastEnterDate = Number(player.last_enter_date);
    const onlineSessionAge = Math.floor(Date.now() / 1000) - lastEnterDate;
    if (Number(player.online) === 1 && (!lastEnterDate || onlineSessionAge > 12 * 60 * 60)) player.online = 0;
    delete player.permanent_data;
    delete player.skins;
    const [[vehicles], [apartments], [vipHouses], [businesses]] = await Promise.all([
      db.query("SELECT id, model, health, fuel, mileage, number_plate, creation_date FROM ugta_vehicles WHERE owner_pid=? AND (deleted IS NULL OR deleted=0) ORDER BY id", [`p:${player.id}`]),
      db.query('SELECT id, number, meter_type, sale_state, paid_days, time_to_pay, paid_upgrade FROM ugta_apartments WHERE user_id=? ORDER BY number', [player.id]),
      db.query('SELECT id, hid, owner, sale_state, meter_type FROM ugta_viphouses WHERE owner=? ORDER BY id', [player.id]),
      db.query('SELECT id, business_id, name, balance, payment_date, weekly_profit FROM ugta_businesses WHERE owner_id=? ORDER BY id', [player.id]),
    ]);
    player.profile_version = 4;
    player.vehicles = vehicles;
    player.apartments = [...apartments, ...vipHouses];
    player.businesses = businesses;
    player.role = await getPlayerRole(db, player.id);
    const { password: _password, ...safePlayer } = player;
    return json(response, 200, { player: safePlayer });
  } catch (error) {
    console.error('auth API failed', error);
    return json(response, 503, { error: 'Авторизація тимчасово недоступна' });
  }
}
