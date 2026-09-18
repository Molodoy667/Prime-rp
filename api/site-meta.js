import { getDatabase, json } from './_db.js';

async function requireAdmin(db, actorId) {
  const id = Number(actorId);
  if (!Number.isInteger(id) || id < 1) return false;
  const [[player]] = await db.query('SELECT cabinet_role FROM ugta_players WHERE id=? LIMIT 1', [id]);
  return player?.cabinet_role === 'admin';
}

export default async function handler(request, response) {
  try {
    const db = getDatabase();
    if (request.method === 'GET') {
      const admin = request.query?.admin === '1';
      if (admin && !(await requireAdmin(db, request.query?.actorId))) return json(response, 403, { error: 'Недостаточно прав' });
      const path = String(request.query?.path || '').trim();
      const [seo] = await db.query(path ? 'SELECT path,title,description,keywords,og_image ogImage FROM site_seo_pages WHERE path=?' : 'SELECT path,title,description,keywords,og_image ogImage FROM site_seo_pages ORDER BY path', path ? [path] : []);
      const [settings] = await db.query('SELECT section,setting_key settingKey,setting_value settingValue,value_type valueType FROM site_settings ORDER BY section,setting_key');
      return json(response, 200, { seo, settings });
    }
    if (request.method === 'POST') {
      const input = request.body || {};
      if (!(await requireAdmin(db, input.actorId))) return json(response, 403, { error: 'Недостаточно прав' });
      if (input.action === 'seo-upsert') { const path = String(input.path || '').trim(); if (!path.startsWith('/')) return json(response, 400, { error: 'Путь страницы должен начинаться с /' }); await db.query('INSERT INTO site_seo_pages (path,title,description,keywords,og_image) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title),description=VALUES(description),keywords=VALUES(keywords),og_image=VALUES(og_image)', [path, String(input.title || '').trim(), String(input.description || '').trim(), String(input.keywords || '').trim(), String(input.ogImage || '').trim() || null]); return json(response, 200, { ok: true }); }
      if (input.action === 'setting-upsert') { const section = String(input.section || '').trim(); const settingKey = String(input.settingKey || '').trim(); if (!section || !settingKey) return json(response, 400, { error: 'Укажите раздел и ключ настройки' }); const allowed = ['text', 'url', 'boolean', 'number', 'json']; const valueType = allowed.includes(input.valueType) ? input.valueType : 'text'; await db.query('INSERT INTO site_settings (section,setting_key,setting_value,value_type) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value),value_type=VALUES(value_type)', [section, settingKey, String(input.settingValue ?? ''), valueType]); return json(response, 200, { ok: true }); }
      return json(response, 400, { error: 'Неизвестное действие' });
    }
    return json(response, 405, { error: 'Метод не поддерживается' });
  } catch (error) { console.error('site-meta API failed', error); return json(response, 400, { error: error instanceof Error ? error.message : 'Ошибка настроек' }); }
}
