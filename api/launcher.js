import { getDatabase, json } from './_db.js';
import { loadStatus } from '../worker/status.mjs';

export default async function handler(request, response) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method ?? 'GET')) {
    response.setHeader('Allow', 'GET, HEAD, OPTIONS');
    return json(response, 405, { error: 'Метод не підтримується' });
  }
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (request.method === 'OPTIONS') return response.status(204).send('');
  try {
    const db = getDatabase();
    const [[settingsRows], [newsRows], server] = await Promise.all([
      db.query("SELECT setting_key settingKey, setting_value settingValue, value_type valueType FROM site_settings WHERE section='launcher' ORDER BY setting_key"),
      db.query('SELECT id,slug,title,category,body,image_url imageUrl,image_data imageData,is_placeholder isPlaceholder,updated_at updatedAt FROM site_news WHERE is_published=1 ORDER BY sort_order,id LIMIT 50'),
      loadStatus(),
    ]);
    const launcher = Object.fromEntries(settingsRows.map(row => [row.settingKey, row.settingValue]));
    const news = newsRows.map(row => ({ ...row, id: String(row.id), image: row.imageData || row.imageUrl || null, imageData: undefined }));
    const payload = { apiVersion: 1, checkedAt: new Date().toISOString(), launcher: { downloadUrl: launcher.download_url || '', resourcesUrl: launcher.resources_url || '', version: launcher.version || '', resourcesVersion: launcher.resources_version || '', maintenance: launcher.maintenance === '1' }, news, servers: server.servers || [], serverCheckedAt: server.checkedAt || null };
    response.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return response.status(200).send(request.method === 'HEAD' ? undefined : JSON.stringify(payload));
  } catch (error) {
    console.error('launcher API failed', error);
    return json(response, 503, { error: 'API лаунчера тимчасово недоступний' });
  }
}
