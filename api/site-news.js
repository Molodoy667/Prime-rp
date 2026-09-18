import { getDatabase, json } from './_db.js';

const MAX_IMAGE_DATA = 2500000;

async function requireAdmin(db, actorId) {
  const id = Number(actorId);
  if (!Number.isInteger(id) || id < 1) return false;
  const [[player]] = await db.query('SELECT cabinet_role FROM ugta_players WHERE id=? LIMIT 1', [id]);
  return player?.cabinet_role === 'admin';
}

function clean(row) {
  return { id: String(row.id), slug: row.slug, title: row.title, category: row.category, body: row.body, image: row.image_data || row.image_url || '/assets/hero-1600.webp', imageUrl: row.image_url || '', imageData: row.image_data || '', isPublished: Boolean(row.is_published), isPlaceholder: Boolean(row.is_placeholder), sortOrder: Number(row.sort_order || 0), updatedAt: row.updated_at };
}

function values(input) {
  const title = String(input.title || '').trim();
  const slug = String(input.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
  const body = String(input.body || '').trim();
  if (!title || !slug || !body) throw new Error('Заполните заголовок, slug и текст новости');
  const imageData = String(input.imageData || '').trim();
  if (imageData && (!/^data:image\/(jpeg|png|webp|gif);base64,/.test(imageData) || imageData.length > MAX_IMAGE_DATA)) throw new Error('Изображение должно быть JPG, PNG, WEBP или GIF размером до 2 МБ');
  return [slug, title.slice(0, 180), String(input.category || 'НОВИНИ').trim().slice(0, 80), body, String(input.imageUrl || '').trim().slice(0, 500) || null, imageData || null, input.isPublished === false ? 0 : 1, input.isPlaceholder ? 1 : 0, Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : 0];
}

export default async function handler(request, response) {
  try {
    const db = getDatabase();
    if (request.method === 'GET') {
      const admin = request.query?.admin === '1';
      if (admin && !(await requireAdmin(db, request.query?.actorId))) return json(response, 403, { error: 'Недостаточно прав' });
      const [rows] = await db.query(`SELECT id,slug,title,category,body,image_url,image_data,is_published,is_placeholder,sort_order,updated_at FROM site_news ${admin ? '' : 'WHERE is_published=1'} ORDER BY sort_order,id`);
      return json(response, 200, { news: rows.map(clean) });
    }
    if (request.method === 'POST') {
      const input = request.body || {};
      if (!(await requireAdmin(db, input.actorId))) return json(response, 403, { error: 'Недостаточно прав' });
      if (input.action === 'delete') { const id = Number(input.id); if (!Number.isInteger(id)) return json(response, 400, { error: 'Некорректный ID новости' }); await db.query('DELETE FROM site_news WHERE id=?', [id]); return json(response, 200, { ok: true }); }
      const [slug, title, category, body, imageUrl, imageData, isPublished, isPlaceholder, sortOrder] = values(input);
      if (input.action === 'create') { const [result] = await db.query('INSERT INTO site_news (slug,title,category,body,image_url,image_data,is_published,is_placeholder,sort_order) VALUES (?,?,?,?,?,?,?,?,?)', [slug, title, category, body, imageUrl, imageData, isPublished, isPlaceholder, sortOrder]); return json(response, 201, { ok: true, id: String(result.insertId) }); }
      if (input.action === 'update') { const id = Number(input.id); if (!Number.isInteger(id)) return json(response, 400, { error: 'Некорректный ID новости' }); await db.query('UPDATE site_news SET slug=?,title=?,category=?,body=?,image_url=?,image_data=?,is_published=?,is_placeholder=?,sort_order=? WHERE id=?', [slug, title, category, body, imageUrl, imageData, isPublished, isPlaceholder, sortOrder, id]); return json(response, 200, { ok: true }); }
      return json(response, 400, { error: 'Неизвестное действие' });
    }
    return json(response, 405, { error: 'Метод не поддерживается' });
  } catch (error) { console.error('site-news API failed', error); return json(response, 400, { error: error instanceof Error ? error.message : 'Ошибка новостей' }); }
}
