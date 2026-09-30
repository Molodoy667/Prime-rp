import { getDatabase, json } from './_db.js';
import { loadStatus } from '../worker/status.mjs';

const fallbackLauncher = {
  downloadUrl: '',
  resourcesUrl: '',
  version: '1.0.0',
  resourcesVersion: '1',
  maintenance: false,
};

const fallbackNews = [
  {
    id: 'opening',
    slug: 'opening',
    title: 'ВЕЛИКЕ ВІДКРИТТЯ PRIME RP',
    category: 'АНОНС',
    body: 'Офіційні новини PRIME RP, дата запуску та інструкція для перших гравців.',
    imageUrl: '/assets/hero-1600.webp',
    image: '/assets/hero-1600.webp',
    isPlaceholder: true,
  },
  {
    id: 'world',
    slug: 'world',
    title: 'ЗНАЙОМСТВО ЗІ СВІТОМ PRIME',
    category: 'СВІТ PRIME',
    body: 'Новини про міста, атмосферу та можливості світу PRIME RP.',
    imageUrl: '/assets/city-1600.webp',
    image: '/assets/city-1600.webp',
    isPlaceholder: true,
  },
  {
    id: 'development',
    slug: 'development',
    title: 'РОЗРОБКА ПРОЄКТУ',
    category: 'ЩОДЕННИК',
    body: 'Офіційні записи команди розробки та оновлення проєкту.',
    imageUrl: '/assets/vehicle-1600.webp',
    image: '/assets/vehicle-1600.webp',
    isPlaceholder: true,
  },
];

const readDatabaseData = async () => {
  const result = { launcher: { ...fallbackLauncher }, news: [...fallbackNews], available: false };

  try {
    const db = getDatabase();
    const [[settingsRows], [newsRows]] = await Promise.all([
      db.query("SELECT setting_key settingKey, setting_value settingValue FROM site_settings WHERE section='launcher' ORDER BY setting_key"),
      db.query('SELECT id,slug,title,category,body,image_url imageUrl,image_data imageData,is_placeholder isPlaceholder,updated_at updatedAt FROM site_news WHERE is_published=1 ORDER BY sort_order,id LIMIT 50'),
    ]);

    const settings = Object.fromEntries(settingsRows.map(row => [row.settingKey, row.settingValue]));
    result.launcher = {
      downloadUrl: settings.download_url || fallbackLauncher.downloadUrl,
      resourcesUrl: settings.resources_url || fallbackLauncher.resourcesUrl,
      version: settings.version || fallbackLauncher.version,
      resourcesVersion: settings.resources_version || fallbackLauncher.resourcesVersion,
      maintenance: settings.maintenance === '1',
    };
    result.news = newsRows.map(row => ({
      ...row,
      id: String(row.id),
      image: row.imageData || row.imageUrl || null,
      imageData: undefined,
    }));
    result.available = true;
  } catch (error) {
    console.error('launcher database data unavailable', error);
  }

  return result;
};

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
    const [database, server] = await Promise.all([readDatabaseData(), loadStatus()]);
    const payload = {
      apiVersion: 1,
      checkedAt: new Date().toISOString(),
      launcher: database.launcher,
      news: database.news,
      servers: server.servers || [],
      serverCheckedAt: server.checkedAt || null,
      // These aliases keep older launcher builds compatible with the current API contract.
      downloadUrl: database.launcher.downloadUrl,
      resourcesUrl: database.launcher.resourcesUrl,
      version: database.launcher.version,
      resourcesVersion: database.launcher.resourcesVersion,
      databaseAvailable: database.available,
    };
    response.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return response.status(200).send(request.method === 'HEAD' ? undefined : JSON.stringify(payload));
  } catch (error) {
    console.error('launcher API failed', error);
    return json(response, 503, { error: 'API лаунчера тимчасово недоступний' });
  }
}
