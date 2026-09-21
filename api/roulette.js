import { getDatabase, json } from './_db.js';
import { requireAdmin } from './access-control.js';

const qualities = {
  white: { label: 'Звичайне', weight: 55 },
  blue: { label: 'Рідкісне', weight: 25 },
  purple: { label: 'Епічне', weight: 12 },
  red: { label: 'Легендарне', weight: 6 },
  yellow: { label: 'Міфічне', weight: 2 },
};

const defaultPrizes = [
  ['white', 'Гроші · 100 000', 'money', '100000', '/assets/accessories/300x140/armor_body_cash.png', 1],
  ['white', 'Досвід · 5 000 XP', 'experience', '5000', '/assets/accessories/300x140/animal_eagle.png', 2],
  ['white', 'Акумулятор', 'item', 'battery', '/assets/accessories/300x140/armor_body_purple.png', 3],
  ['blue', 'Преміум · 1 день', 'premium', '86400', '/assets/skins/130x160/6791.png', 1],
  ['blue', 'Гроші · 250 000', 'money', '250000', '/assets/accessories/300x140/armor_body_red_heart.png', 2],
  ['blue', 'Скін · Скінхед', 'skin', '47', '/assets/skins/130x160/47.png', 3],
  ['purple', 'Аксесуар · Рожеві крила', 'accessory', 'animal_fenix.png', '/assets/accessories/300x140/animal_fenix.png', 1],
  ['purple', 'Скін · Грабіжник', 'skin', '101', '/assets/skins/130x160/101.png', 2],
  ['purple', 'Автомобіль · BMW X5 Competition', 'vehicle', '6585', '/assets/vehicles/300x160/6585.png', 3],
  ['red', 'Скін · Пекельна леді', 'skin', '257', '/assets/skins/130x160/257.png', 1],
  ['red', 'Автомобіль · Lamborghini Terzo', 'vehicle', '6699', '/assets/vehicles/300x160/6699.png', 2],
  ['red', 'Аксесуар · Розкішні крила', 'accessory', 'animal_fenix.png', '/assets/accessories/300x140/animal_fenix.png', 3],
  ['yellow', 'Автомобіль · Mercedes-AMG G63 2022', 'vehicle', '6535', '/assets/vehicles/300x160/6535.png', 1],
  ['yellow', 'Гроші · 1 000 000', 'money', '1000000', '/assets/accessories/300x140/armor_body_cash.png', 2],
];

async function ensureSchema(db) {
  await db.query(`CREATE TABLE IF NOT EXISTS site_roulette_prizes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    quality VARCHAR(20) NOT NULL,
    title VARCHAR(180) NOT NULL,
    reward_type VARCHAR(40) NOT NULL,
    reward_value VARCHAR(180) NOT NULL DEFAULT '',
    image_url VARCHAR(500) NULL,
    weight DECIMAL(10,2) NOT NULL DEFAULT 1,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY roulette_quality (quality, is_active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS site_roulette_players (
    player_id INT UNSIGNED NOT NULL,
    free_spins INT NOT NULL DEFAULT 1,
    balance INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (player_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await db.query(`CREATE TABLE IF NOT EXISTS site_roulette_history (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id INT UNSIGNED NOT NULL,
    prize_id BIGINT UNSIGNED NULL,
    quality VARCHAR(20) NOT NULL,
    title VARCHAR(180) NOT NULL,
    image_url VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id), KEY roulette_history_player (player_id, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  const [[count]] = await db.query('SELECT COUNT(*) count FROM site_roulette_prizes');
  if (!Number(count.count)) {
    for (const [quality, title, rewardType, rewardValue, imageUrl, sortOrder] of defaultPrizes) {
      await db.query('INSERT INTO site_roulette_prizes (quality,title,reward_type,reward_value,image_url,weight,sort_order) VALUES (?,?,?,?,?,?,?)', [quality, title, rewardType, rewardValue, imageUrl, qualities[quality].weight, sortOrder]);
    }
  }
}

function safePlayerId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

function draw(prizes) {
  const total = prizes.reduce((sum, prize) => sum + Math.max(0, Number(prize.weight) || 0), 0);
  if (!total) return prizes[0];
  let cursor = Math.random() * total;
  return prizes.find(prize => { cursor -= Math.max(0, Number(prize.weight) || 0); return cursor <= 0; }) || prizes[prizes.length - 1];
}

function normalizePrize(row) {
  return { id: Number(row.id), quality: row.quality, qualityLabel: qualities[row.quality]?.label || row.quality, title: row.title, rewardType: row.reward_type, rewardValue: row.reward_value, imageUrl: row.image_url, weight: Number(row.weight), isActive: Boolean(row.is_active), sortOrder: Number(row.sort_order) };
}

export default async function handler(request, response) {
  try {
    const db = getDatabase();
    await ensureSchema(db);
    if (request.method === 'GET') {
      const admin = request.query?.admin === '1';
      const actorId = safePlayerId(request.query?.actorId);
      if (admin && !(await requireAdmin(db, actorId))) return json(response, 403, { error: 'Недостатньо прав' });
      const playerId = safePlayerId(request.query?.playerId || actorId);
      if (!admin && !playerId) return json(response, 401, { error: 'Потрібна авторизація' });
      const [prizeRows] = await db.query(admin ? 'SELECT * FROM site_roulette_prizes ORDER BY quality, sort_order, id' : 'SELECT * FROM site_roulette_prizes WHERE is_active=1 ORDER BY quality, sort_order, id');
      if (admin) return json(response, 200, { prizes: prizeRows.map(normalizePrize), qualities });
      await db.query('INSERT IGNORE INTO site_roulette_players (player_id) VALUES (?)', [playerId]);
      const [[wallet]] = await db.query('SELECT free_spins,balance FROM site_roulette_players WHERE player_id=?', [playerId]);
      const [historyRows] = await db.query('SELECT id,quality,title,image_url imageUrl,created_at createdAt FROM site_roulette_history WHERE player_id=? ORDER BY id DESC LIMIT 30', [playerId]);
      return json(response, 200, { prizes: prizeRows.map(normalizePrize), qualities, freeSpins: Number(wallet?.free_spins || 0), balance: Number(wallet?.balance || 0), history: historyRows });
    }
    if (request.method !== 'POST') return json(response, 405, { error: 'Метод не підтримується' });
    const input = request.body || {};
    const playerId = safePlayerId(input.playerId);
    if (input.action === 'spin') {
      if (!playerId) return json(response, 401, { error: 'Потрібна авторизація' });
      const [prizeRows] = await db.query('SELECT * FROM site_roulette_prizes WHERE is_active=1 ORDER BY id');
      if (!prizeRows.length) return json(response, 503, { error: 'Призи ще не налаштовані' });
      await db.query('INSERT IGNORE INTO site_roulette_players (player_id) VALUES (?)', [playerId]);
      const [[wallet]] = await db.query('SELECT free_spins,balance FROM site_roulette_players WHERE player_id=?', [playerId]);
      if (Number(wallet.free_spins) <= 0 && Number(wallet.balance) <= 0) return json(response, 400, { error: 'Безкоштовні обертання закінчилися' });
      const useFree = Number(wallet.free_spins) > 0;
      await db.query('UPDATE site_roulette_players SET free_spins=GREATEST(0,free_spins-?), balance=GREATEST(0,balance-?) WHERE player_id=?', [useFree ? 1 : 0, useFree ? 0 : 1, playerId]);
      const prize = draw(prizeRows);
      await db.query('INSERT INTO site_roulette_history (player_id,prize_id,quality,title,image_url) VALUES (?,?,?,?,?)', [playerId, prize.id, prize.quality, prize.title, prize.image_url]);
      return json(response, 200, { prize: normalizePrize(prize), freeSpins: Math.max(0, Number(wallet.free_spins) - (useFree ? 1 : 0)), balance: Math.max(0, Number(wallet.balance) - (useFree ? 0 : 1)) });
    }
    if (!(await requireAdmin(db, safePlayerId(input.actorId)))) return json(response, 403, { error: 'Недостатньо прав' });
    if (input.action === 'delete') { await db.query('DELETE FROM site_roulette_prizes WHERE id=?', [Number(input.id)]); return json(response, 200, { ok: true }); }
    if (input.action === 'save') {
      const quality = String(input.quality || 'white');
      if (!qualities[quality]) return json(response, 400, { error: 'Невідомий рівень якості' });
      const values = [quality, String(input.title || '').trim(), String(input.rewardType || 'item'), String(input.rewardValue || ''), String(input.imageUrl || '').trim() || null, Math.max(0, Number(input.weight) || 1), input.isActive === false ? 0 : 1, Number(input.sortOrder) || 0];
      if (!values[1]) return json(response, 400, { error: 'Вкажіть назву призу' });
      if (Number(input.id)) await db.query('UPDATE site_roulette_prizes SET quality=?,title=?,reward_type=?,reward_value=?,image_url=?,weight=?,is_active=?,sort_order=? WHERE id=?', [...values, Number(input.id)]);
      else await db.query('INSERT INTO site_roulette_prizes (quality,title,reward_type,reward_value,image_url,weight,is_active,sort_order) VALUES (?,?,?,?,?,?,?,?)', values);
      return json(response, 200, { ok: true });
    }
    return json(response, 400, { error: 'Невідома дія' });
  } catch (error) { console.error('roulette API failed', error); return json(response, 503, { error: 'Рулетка тимчасово недоступна' }); }
}
