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
  ['white', 'Гроші · 50 000', 'money', '50000', '/assets/accessories/300x140/armor_body_cash.png', 4],
  ['white', 'Досвід · 10 000 XP', 'experience', '10000', '/assets/accessories/300x140/animal_eagle.png', 5],
  ['white', 'Предмет · Каністра', 'item', 'fuel_canister', '/assets/accessories/300x140/fuel_canister.png', 6],
  ['blue', 'Гроші · 500 000', 'money', '500000', '/assets/accessories/300x140/armor_body_cash.png', 4],
  ['blue', 'Преміум · 3 дні', 'premium', '259200', '/assets/skins/130x160/6791.png', 5],
  ['blue', 'Скін · Футболіст', 'skin', '73', '/assets/skins/130x160/73.png', 6],
  ['purple', 'Автомобіль · BMW M8', 'vehicle', '6586', '/assets/vehicles/300x160/6586.png', 4],
  ['purple', 'Аксесуар · Рюкзак', 'accessory', 'backpack_modern.png', '/assets/accessories/300x140/backpack_modern.png', 5],
  ['red', 'Скін · Стильний мафіозі', 'skin', '120', '/assets/skins/130x160/120.png', 4],
  ['red', 'Автомобіль · Porsche 911 GT3', 'vehicle', '6697', '/assets/vehicles/300x160/6697.png', 5],
  ['yellow', 'Автомобіль · McLaren 720S', 'vehicle', '6698', '/assets/vehicles/300x160/6698.png', 3],
  ['yellow', 'Скін · Пекельна леді', 'skin', '257', '/assets/skins/130x160/257.png', 4],
  ['white', 'Гроші · 25 000', 'money', '25000', '/assets/accessories/300x140/armor_body_cash.png', 7],
  ['white', 'Предмет · Ремкомплект', 'item', 'repair_kit', '/assets/accessories/300x140/armor_body_purple.png', 8],
  ['white', 'Предмет · Аптечка', 'item', 'medkit', '/assets/accessories/300x140/armor_body_red_heart.png', 9],
  ['blue', 'Досвід · 25 000 XP', 'experience', '25000', '/assets/accessories/300x140/animal_eagle.png', 7],
  ['blue', 'Преміум · 7 днів', 'premium', '604800', '/assets/skins/130x160/6791.png', 8],
  ['blue', 'Скін · Мовчазний титан', 'skin', '73', '/assets/skins/130x160/73.png', 7],
  ['purple', 'Автомобіль · Porsche Carrera GT', 'vehicle', '6679', '/assets/vehicles/300x160/6679.png', 6],
  ['purple', 'Автомобіль · Mercedes-Benz W221', 'vehicle', '6692', '/assets/vehicles/300x160/6692.png', 7],
  ['red', 'Скін · Вуличний стиль', 'skin', '120', '/assets/skins/130x160/120.png', 6],
  ['red', 'Автомобіль · BMW M8', 'vehicle', '6586', '/assets/vehicles/300x160/6586.png', 7],
  ['yellow', 'Автомобіль · Porsche 911 GT3', 'vehicle', '6697', '/assets/vehicles/300x160/6697.png', 4],
  ['yellow', 'Донат · 2 500', 'donate', '2500', '/assets/accessories/300x140/armor_body_cash.png', 5],
  ['yellow', 'Автомобіль · Mercedes-Benz GT63s 4.0 V8', 'vehicle', '6529', '/assets/vehicles/300x160/6529.png', 4],
  ['yellow', 'Автомобіль · Can-Am Maverick X3', 'vehicle', '434', '/assets/vehicles/300x160/434.png', 4],
  ['red', 'Скін · Байкерша', 'skin', '145', '/assets/skins/130x160/145.png', 7],
  ['red', 'Скін · Джо Барбаро', 'skin', '234', '/assets/skins/130x160/234.png', 7],
  ['red', 'Скін · Дівчина дайвер', 'skin', '254', '/assets/skins/130x160/254.png', 7],
  ['purple', 'Автомобіль · BMW M3 E92', 'vehicle', '6635', '/assets/vehicles/300x160/6635.png', 8],
  ['purple', 'Автомобіль · Toyota Corolla AE86', 'vehicle', '477', '/assets/vehicles/300x160/477.png', 8],
  ['purple', 'Автомобіль · Chevrolet Aveo', 'vehicle', '6564', '/assets/vehicles/300x160/6564.png', 8],
  ['blue', 'Скін · Курортниця', 'skin', '39', '/assets/skins/130x160/39.png', 8],
  ['blue', 'Скін · Спортивна', 'skin', '6729', '/assets/skins/130x160/6729.png', 8],
  ['blue', 'Автомобіль · Citroen AMI', 'vehicle', '496', '/assets/vehicles/300x160/496.png', 8],
  ['white', 'Автомобіль · Skoda Octavia 7', 'vehicle', '6575', '/assets/vehicles/300x160/6575.png', 9],
  ['white', 'Автомобіль · Електросамокат', 'vehicle', '510', '/assets/vehicles/300x160/510.png', 9],
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
    free_spins INT NOT NULL DEFAULT 10,
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
  await db.query(`CREATE TABLE IF NOT EXISTS site_roulette_wins (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    player_id INT UNSIGNED NOT NULL,
    prize_id BIGINT UNSIGNED NULL,
    quality VARCHAR(20) NOT NULL,
    title VARCHAR(180) NOT NULL,
    reward_type VARCHAR(40) NOT NULL,
    reward_value VARCHAR(180) NOT NULL DEFAULT '',
    image_url VARCHAR(500) NULL,
    sell_price INT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('pending','claimed','sold') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP NULL,
    PRIMARY KEY (id), KEY roulette_wins_player (player_id, status, created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  // Migrate untouched wallets created by the first version from 1 to the new 10-spin allowance.
  await db.query("UPDATE site_roulette_players p LEFT JOIN site_roulette_history h ON h.player_id=p.player_id SET p.free_spins=10 WHERE p.free_spins=1 AND h.player_id IS NULL");
  await db.query("INSERT IGNORE INTO site_settings (section,setting_key,setting_value,value_type) VALUES ('roulette','spin_price','89','number')");
  const [[count]] = await db.query('SELECT COUNT(*) count FROM site_roulette_prizes');
  if (Number(count.count) < defaultPrizes.length) {
    for (const [quality, title, rewardType, rewardValue, imageUrl, sortOrder] of defaultPrizes) {
      await db.query('INSERT INTO site_roulette_prizes (quality,title,reward_type,reward_value,image_url,weight,sort_order) SELECT ?,?,?,?,?,?,? FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM site_roulette_prizes WHERE title=? LIMIT 1)', [quality, title, rewardType, rewardValue, imageUrl, qualities[quality].weight, sortOrder, title]);
    }
  }
}

function safePlayerId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

async function getRouletteConfig(db) {
  const [settingRows] = await db.query("SELECT setting_value FROM site_settings WHERE section='roulette' AND setting_key='spin_price' LIMIT 1");
  const spinPrice = Math.max(1, Math.floor(Number(settingRows[0]?.setting_value) || 89));
  const [columnRows] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ugta_players'");
  const columns = new Set(columnRows.map(row => String(row.COLUMN_NAME)));
  const freeSpinColumn = ['free_spin','free_spins','roulette_free_spins','roulette_spins','free_roulette_spins','case_free_spins'].find(name => columns.has(name)) || null;
  return { spinPrice, freeSpinColumn };
}

function identifier(name) { return `\`${String(name).replace(/`/g, '')}\``; }

async function getPlayerRouletteWallet(db, playerId, config) {
  const freeColumn = config.freeSpinColumn ? `,${identifier(config.freeSpinColumn)}` : '';
  const [[player]] = await db.query(`SELECT donate${freeColumn} FROM ugta_players WHERE id=? LIMIT 1`, [playerId]);
  return { donate: Number(player?.donate || 0), freeSpins: config.freeSpinColumn ? Number(player?.[config.freeSpinColumn] || 0) : 0 };
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
      if (request.query?.recent === '1') {
        const [recentRows] = await db.query(`
          SELECT w.id,w.quality,w.title,w.reward_type rewardType,w.image_url imageUrl,
                 w.created_at createdAt,p.nickname
          FROM site_roulette_wins w
          LEFT JOIN ugta_players p ON p.id=w.player_id
          ORDER BY w.id DESC LIMIT 12
        `);
        return json(response, 200, { recentWins: recentRows });
      }
      const playerId = safePlayerId(request.query?.playerId || actorId);
      if (!admin && !playerId) return json(response, 401, { error: 'Потрібна авторизація' });
      const [prizeRows] = await db.query(admin ? 'SELECT * FROM site_roulette_prizes ORDER BY quality, sort_order, id' : 'SELECT * FROM site_roulette_prizes WHERE is_active=1 ORDER BY quality, sort_order, id');
      if (admin) return json(response, 200, { prizes: prizeRows.map(normalizePrize), qualities });
      const config = await getRouletteConfig(db);
      const wallet = await getPlayerRouletteWallet(db, playerId, config);
      const [historyRows] = await db.query('SELECT id,quality,title,image_url imageUrl,created_at createdAt FROM site_roulette_history WHERE player_id=? ORDER BY id DESC LIMIT 30', [playerId]);
      const [winRows] = await db.query("SELECT id,quality,title,reward_type rewardType,reward_value rewardValue,image_url imageUrl,sell_price sellPrice,status,created_at createdAt FROM site_roulette_wins WHERE player_id=? ORDER BY id DESC LIMIT 30", [playerId]);
      return json(response, 200, { prizes: prizeRows.map(normalizePrize), qualities, freeSpins: wallet.freeSpins, balance: wallet.donate, donate: wallet.donate, spinPrice: config.spinPrice, freeSpinColumn: config.freeSpinColumn, history: historyRows, wins: winRows });
    }
    if (request.method !== 'POST') return json(response, 405, { error: 'Метод не підтримується' });
    const input = request.body || {};
    const playerId = safePlayerId(input.playerId);
    if (input.action === 'spin') {
      if (!playerId) return json(response, 401, { error: 'Потрібна авторизація' });
      const spinCount = Math.min(5, Math.max(1, Math.floor(Number(input.count) || 1)));
      const [prizeRows] = await db.query('SELECT * FROM site_roulette_prizes WHERE is_active=1 ORDER BY id');
      if (!prizeRows.length) return json(response, 503, { error: 'Призи ще не налаштовані' });
      const config = await getRouletteConfig(db);
      const wallet = await getPlayerRouletteWallet(db, playerId, config);
      const paidMode = input.mode === 'paid';
      const freeUsed = !paidMode && config.freeSpinColumn ? Math.min(spinCount, wallet.freeSpins) : 0;
      const paidCount = spinCount - freeUsed;
      const totalCost = paidCount * config.spinPrice;
      if (paidCount && wallet.donate < totalCost) return json(response, 400, { error: `Недостатньо донату. Для ${spinCount} прокруток потрібно ${totalCost}` });
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        if (freeUsed) {
          const result = await connection.query(`UPDATE ugta_players SET ${identifier(config.freeSpinColumn)}=GREATEST(0,${identifier(config.freeSpinColumn)}-?) WHERE id=? AND ${identifier(config.freeSpinColumn)}>=?`, [freeUsed, playerId, freeUsed]);
          if (!result[0].affectedRows) throw new Error('Безкоштовні обертання вже змінилися, повторіть запит');
        }
        if (paidCount) {
          const result = await connection.query('UPDATE ugta_players SET donate=donate-? WHERE id=? AND donate>=?', [totalCost, playerId, totalCost]);
          if (!result[0].affectedRows) throw new Error('Баланс донату змінився, повторіть запит');
        }
        const results = [];
        for (let index = 0; index < spinCount; index += 1) {
          const prize = draw(prizeRows);
          await connection.query('INSERT INTO site_roulette_history (player_id,prize_id,quality,title,image_url) VALUES (?,?,?,?,?)', [playerId, prize.id, prize.quality, prize.title, prize.image_url]);
          const sellPrice = Math.max(0, Math.round(Number(prize.reward_value) * 0.35)) || (prize.quality === 'yellow' ? 500000 : prize.quality === 'red' ? 150000 : prize.quality === 'purple' ? 50000 : prize.quality === 'blue' ? 15000 : 5000);
          const [winResult] = await connection.query('INSERT INTO site_roulette_wins (player_id,prize_id,quality,title,reward_type,reward_value,image_url,sell_price) VALUES (?,?,?,?,?,?,?,?)', [playerId, prize.id, prize.quality, prize.title, prize.reward_type, prize.reward_value, prize.image_url, sellPrice]);
          results.push({ prize: normalizePrize(prize), winId: Number(winResult.insertId), sellPrice });
        }
        await connection.commit();
        return json(response, 200, { results, prize: results[0].prize, winId: results[0].winId, sellPrice: results[0].sellPrice, count: spinCount, freeSpins: Math.max(0, wallet.freeSpins - freeUsed), balance: Math.max(0, wallet.donate - totalCost), donate: Math.max(0, wallet.donate - totalCost), spinPrice: config.spinPrice });
      } catch (error) {
        await connection.rollback();
        return json(response, 409, { error: error instanceof Error ? error.message : 'Не вдалося виконати прокрутку' });
      } finally { connection.release(); }
    }
    if (input.action === 'claim' || input.action === 'sell') {
      if (!playerId) return json(response, 401, { error: 'Потрібна авторизація' });
      const winId = Number(input.winId);
      if (!Number.isInteger(winId) || winId < 1) return json(response, 400, { error: 'Невірний виграш' });
      const [[win]] = await db.query("SELECT * FROM site_roulette_wins WHERE id=? AND player_id=? AND status='pending' LIMIT 1", [winId, playerId]);
      if (!win) return json(response, 409, { error: 'Виграш вже оброблено або не знайдено' });
      if (input.action === 'sell') {
        await db.query("UPDATE site_roulette_wins SET status='sold',claimed_at=CURRENT_TIMESTAMP WHERE id=? AND player_id=? AND status='pending'", [winId, playerId]);
        await db.query('UPDATE ugta_players SET donate=donate+? WHERE id=?', [win.sell_price, playerId]);
        return json(response, 200, { ok: true, action: 'sold', amount: Number(win.sell_price) });
      }
      if (win.reward_type === 'money') await db.query('UPDATE ugta_players SET money=money+? WHERE id=?', [Math.max(0, Number(win.reward_value) || 0), playerId]);
      else if (win.reward_type === 'premium') await db.query('UPDATE ugta_players SET premium_time_left=premium_time_left+? WHERE id=?', [Math.max(0, Number(win.reward_value) || 0), playerId]);
      else if (win.reward_type === 'experience') await db.query('UPDATE ugta_players SET exp=exp+? WHERE id=?', [Math.max(0, Number(win.reward_value) || 0), playerId]);
      await db.query("UPDATE site_roulette_wins SET status='claimed',claimed_at=CURRENT_TIMESTAMP WHERE id=? AND player_id=? AND status='pending'", [winId, playerId]);
      return json(response, 200, { ok: true, action: 'claimed', directGameCredit: ['money','premium','experience'].includes(win.reward_type), gameTables: ['money','premium','experience'].includes(win.reward_type) ? ['ugta_players'] : [] });
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
