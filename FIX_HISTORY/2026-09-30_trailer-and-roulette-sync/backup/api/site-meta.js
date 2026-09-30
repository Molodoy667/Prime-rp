import { getDatabase, json } from './_db.js';
import { requireAdmin } from './access-control.js';

const defaultSeo = [
  { path:'/wiki', title:'Вікі PRIME RP — скіни та моделі машин', description:'Каталог скінів і моделей машин PRIME RP з ID, назвами та зображеннями для гравців.', keywords:'PRIME RP, вікі, скіни GTA, моделі машин GTA, MTA RolePlay, Era Prime', ogImage:'https://prime-rp.store/assets/locations/kyiv.webp', canonicalUrl:'https://prime-rp.store/wiki', robots:'index,follow' },
  { path:'/donate', title:'Донат-магазин PRIME RP — можливості для гравців', description:'Офіційний донат-магазин PRIME RP: PRIME-бонуси, підписки та додаткові можливості для підтримки проєкту.', keywords:'донат PRIME RP, магазин PRIME RP, підписка MTA, Era Prime бонуси', ogImage:'https://prime-rp.store/assets/official-brand-original.webp', canonicalUrl:'https://prime-rp.store/donate', robots:'index,follow' },
];
const defaultSettings = [
  { section: 'general', settingKey: 'contact_discord', settingValue: '#', valueType: 'url' },
  { section: 'general', settingKey: 'social_links', settingValue: '[]', valueType: 'json' },
  { section: 'roulette', settingKey: 'spin_price', settingValue: '89', valueType: 'number' },
];

export default async function handler(request, response) {
  try {
    const db = getDatabase();
    if (request.method === 'GET') {
      const admin = request.query?.admin === '1';
      if (admin && !(await requireAdmin(db, request.query?.actorId))) return json(response, 403, { error: 'Недостаточно прав' });
      const path = String(request.query?.path || '').trim();
      const [rows] = await db.query(path ? 'SELECT path,title,description,keywords,og_image ogImage,canonical_url canonicalUrl,robots FROM site_seo_pages WHERE path=?' : 'SELECT path,title,description,keywords,og_image ogImage,canonical_url canonicalUrl,robots FROM site_seo_pages ORDER BY path', path ? [path] : []);
      const seo = admin && !path ? [...rows, ...defaultSeo.filter(item => !rows.some(row => row.path === item.path))] : rows;
      const [settingsRows] = await db.query(admin ? 'SELECT section,setting_key settingKey,setting_value settingValue,value_type valueType FROM site_settings ORDER BY section,setting_key' : "SELECT section,setting_key settingKey,setting_value settingValue,value_type valueType FROM site_settings WHERE section <> 'access' ORDER BY section,setting_key");
      const settings = [...settingsRows, ...defaultSettings.filter(item => !settingsRows.some(row => row.section === item.section && row.settingKey === item.settingKey))];
      return json(response, 200, { seo, settings });
    }
    if (request.method === 'POST') {
      const input = request.body || {};
      if (!(await requireAdmin(db, input.actorId))) return json(response, 403, { error: 'Недостаточно прав' });
      if (input.action === 'seo-upsert') { const path = String(input.path || '').trim(); if (!path.startsWith('/')) return json(response, 400, { error: 'Шлях сторінки має починатися з /' }); await db.query('INSERT INTO site_seo_pages (path,title,description,keywords,og_image,canonical_url,robots) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title),description=VALUES(description),keywords=VALUES(keywords),og_image=VALUES(og_image),canonical_url=VALUES(canonical_url),robots=VALUES(robots)', [path, String(input.title || '').trim(), String(input.description || '').trim(), String(input.keywords || '').trim(), String(input.ogImage || '').trim() || null, String(input.canonicalUrl || '').trim() || null, String(input.robots || 'index,follow').trim()]); return json(response, 200, { ok: true }); }
      if (input.action === 'setting-upsert') { const section = String(input.section || '').trim(); const settingKey = String(input.settingKey || '').trim(); if (!section || !settingKey) return json(response, 400, { error: 'Укажите раздел и ключ настройки' }); const allowed = ['text', 'url', 'boolean', 'number', 'json']; const valueType = allowed.includes(input.valueType) ? input.valueType : 'text'; await db.query('INSERT INTO site_settings (section,setting_key,setting_value,value_type) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value),value_type=VALUES(value_type)', [section, settingKey, String(input.settingValue ?? ''), valueType]); return json(response, 200, { ok: true }); }
      return json(response, 400, { error: 'Неизвестное действие' });
    }
    return json(response, 405, { error: 'Метод не поддерживается' });
  } catch (error) { console.error('site-meta API failed', error); return json(response, 400, { error: error instanceof Error ? error.message : 'Ошибка настроек' }); }
}
