import { getDatabase, json } from './_db.js';
import { ensureForumSchema } from './forum-schema.js';

const parseTags = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try { return JSON.parse(value || '[]'); } catch { return []; }
};
const clean = (row) => ({
  ...row,
  id: String(row.id), categoryId: row.categoryId == null ? '' : String(row.categoryId),
  topicId: row.topicId == null ? '' : String(row.topicId), authorId: row.authorId == null ? '' : String(row.authorId),
  lastAuthorId: row.lastAuthorId == null ? '' : String(row.lastAuthorId),
  parentId: row.parentId == null ? undefined : String(row.parentId),
  topics: Number(row.topics || 0), posts: Number(row.posts || 0), replies: Number(row.replies || 0), views: Number(row.views || 0),
  tags: parseTags(row.tags), pinned: Boolean(row.pinned), locked: Boolean(row.locked),
});
const text = (value, max = 255) => String(value ?? '').trim().slice(0, max);
async function actor(db, id) { if (!id) return null; const [rows] = await db.query('SELECT id,username,role FROM forum_users WHERE id=? LIMIT 1', [id]); return rows[0] || null; }
const canModerate = (user) => user?.role === 'admin' || user?.role === 'moderator';
const canAdmin = (user) => user?.role === 'admin';
const fail = (response, message = 'Недостатньо прав') => json(response, 403, { error: message });

async function readForum(db, request) {
  const [categories] = await db.query(`SELECT c.id,c.parent_id parentId,c.title,c.description,c.icon,c.color,c.sort_order sortOrder,COUNT(DISTINCT t.id) topics,COUNT(DISTINCT r.id) posts FROM forum_categories c LEFT JOIN forum_topics t ON t.category_id=c.id LEFT JOIN forum_replies r ON r.topic_id=t.id GROUP BY c.id,c.parent_id,c.title,c.description,c.icon,c.color,c.sort_order ORDER BY c.sort_order,c.id`);
  const [topics] = await db.query(`SELECT t.id,t.category_id categoryId,t.title,t.body excerpt,u.id authorId,u.username author,u.role authorRole,u.tag_label authorTagLabel,u.tag_color authorTagColor,t.replies_count replies,t.views,t.created_at createdAt,t.updated_at updatedAt,la.id lastAuthorId,la.username lastAuthor,la.role lastAuthorRole,la.tag_label lastAuthorTagLabel,la.tag_color lastAuthorTagColor,t.last_at lastAt,t.pinned,t.locked,t.tags FROM forum_topics t JOIN forum_users u ON u.id=t.author_id LEFT JOIN forum_users la ON la.id=t.last_author ORDER BY t.pinned DESC,t.last_at DESC,t.created_at DESC`);
  const [replies] = await db.query(`SELECT r.id,r.topic_id topicId,u.id authorId,u.username author,u.role,u.tag_label authorTagLabel,u.tag_color authorTagColor,r.body,r.created_at createdAt,r.updated_at updatedAt,r.likes FROM forum_replies r JOIN forum_users u ON u.id=r.author_id ORDER BY r.created_at`);
  const [[members]] = await db.query('SELECT COUNT(*) total FROM forum_users');
  const [[online]] = await db.query('SELECT COUNT(*) total FROM ugta_players WHERE online > 0');
  const result = { categories: categories.map(clean), topics: topics.map(clean), replies: replies.map(clean), stats: { members: Number(members.total), topics: topics.length, online: Number(online.total) } };
  if (request.query?.admin === '1') {
    const current = await actor(db, request.query.userId);
    if (canAdmin(current)) {
      const [users] = await db.query('SELECT id,username,email,role,tag_label tagLabel,tag_color tagColor,bio,city,discord,phone,created_at joined FROM forum_users ORDER BY username');
      result.members = users.map(clean);
    }
  }
  return result;
}

export default async function handler(request, response) {
  try {
    const db = getDatabase(); await ensureForumSchema(db);
    if (request.method === 'GET') return json(response, 200, await readForum(db, request));
    if (request.method !== 'POST') return json(response, 405, { error: 'Метод не підтримується' });
    const body = request.body || {}; const { action, userId } = body; const current = await actor(db, userId);
    if (!current) return json(response, 401, { error: 'Потрібна авторизація' });
    const noBodyActions = ['create-category','update-category','delete-category','delete-topic','delete-reply','moderate-topic','move-topic','update-profile','update-user-tag'];
    if (!body.body?.trim() && !noBodyActions.includes(action)) return json(response, 400, { error: 'Потрібні обов’язкові дані' });
    if (action === 'create-category') {
      if (!canAdmin(current)) return fail(response);
      await db.query('INSERT INTO forum_categories (parent_id,title,description,icon,color,sort_order) VALUES (?,?,?,?,?,?)', [body.parentId || null, text(body.title, 120), text(body.description || 'Розділ спільноти'), text(body.icon || 'messages', 40), text(body.color || '#d6a84b', 20), Number(body.sortOrder || 0)]);
    } else if (action === 'update-category') {
      if (!canAdmin(current)) return fail(response);
      await db.query('UPDATE forum_categories SET parent_id=?,title=?,description=?,icon=?,color=?,sort_order=? WHERE id=?', [body.parentId || null, text(body.title, 120), text(body.description || 'Розділ спільноти'), text(body.icon || 'messages', 40), text(body.color || '#d6a84b', 20), Number(body.sortOrder || 0), body.categoryId]);
    } else if (action === 'delete-category') {
      if (!canAdmin(current)) return fail(response);
      await db.query('UPDATE forum_topics SET category_id=NULL WHERE category_id=?', [body.categoryId]); await db.query('DELETE FROM forum_categories WHERE id=?', [body.categoryId]);
    } else if (action === 'create-topic') {
      const title = text(body.title, 180); const message = text(body.body, 20000);
      if (!title || !message || !body.categoryId) return json(response, 400, { error: 'Вкажіть розділ, назву та текст теми' });
      const [category] = await db.query('SELECT id FROM forum_categories WHERE id=? LIMIT 1', [body.categoryId]);
      if (!category[0]) return json(response, 400, { error: 'Розділ не знайдено' });
      await db.query('INSERT INTO forum_topics (category_id,author_id,title,body,tags,last_author,last_at) VALUES (?,?,?,?,?,?,NOW())', [body.categoryId, current.id, title, message, JSON.stringify(body.tags || ['нова тема']), current.id]);
    } else if (action === 'update-topic') {
      const [rows] = await db.query('SELECT author_id authorId FROM forum_topics WHERE id=? LIMIT 1', [body.topicId]);
      if (!rows[0] || (String(rows[0].authorId) !== String(current.id) && !canModerate(current))) return fail(response);
      await db.query('UPDATE forum_topics SET title=?,body=?,updated_at=NOW() WHERE id=?', [text(body.title, 180), text(body.body, 20000), body.topicId]);
    } else if (action === 'delete-topic') {
      const [rows] = await db.query('SELECT author_id authorId FROM forum_topics WHERE id=? LIMIT 1', [body.topicId]);
      if (!rows[0] || (String(rows[0].authorId) !== String(current.id) && !canModerate(current))) return fail(response);
      await db.query('DELETE FROM forum_replies WHERE topic_id=?', [body.topicId]); await db.query('DELETE FROM forum_topics WHERE id=?', [body.topicId]);
    } else if (action === 'create-reply') {
      const [rows] = await db.query('SELECT id,locked FROM forum_topics WHERE id=? LIMIT 1', [body.topicId]);
      if (!rows[0]) return json(response, 404, { error: 'Тему не знайдено' }); if (rows[0].locked) return json(response, 409, { error: 'Тему закрито для відповідей' });
      await db.query('INSERT INTO forum_replies (topic_id,author_id,body) VALUES (?,?,?)', [body.topicId, current.id, text(body.body, 20000)]);
      await db.query('UPDATE forum_topics SET replies_count=replies_count+1,last_author=?,last_at=NOW(),updated_at=NOW() WHERE id=?', [current.id, body.topicId]);
    } else if (action === 'update-reply') {
      const [rows] = await db.query('SELECT author_id authorId FROM forum_replies WHERE id=? LIMIT 1', [body.replyId]);
      if (!rows[0] || (String(rows[0].authorId) !== String(current.id) && !canModerate(current))) return fail(response);
      await db.query('UPDATE forum_replies SET body=?,updated_at=NOW() WHERE id=?', [text(body.body, 20000), body.replyId]);
    } else if (action === 'delete-reply') {
      const [rows] = await db.query('SELECT author_id authorId,topic_id topicId FROM forum_replies WHERE id=? LIMIT 1', [body.replyId]);
      if (!rows[0] || (String(rows[0].authorId) !== String(current.id) && !canModerate(current))) return fail(response);
      await db.query('DELETE FROM forum_replies WHERE id=?', [body.replyId]); await db.query('UPDATE forum_topics SET replies_count=GREATEST(0,replies_count-1),updated_at=NOW() WHERE id=?', [rows[0].topicId]);
    } else if (action === 'moderate-topic') {
      if (!canModerate(current) || !['pinned','locked'].includes(body.field)) return fail(response);
      await db.query(`UPDATE forum_topics SET \`${body.field}\`=NOT \`${body.field}\`,updated_at=NOW() WHERE id=?`, [body.topicId]);
    } else if (action === 'move-topic') {
      if (!canAdmin(current)) return fail(response); await db.query('UPDATE forum_topics SET category_id=?,updated_at=NOW() WHERE id=?', [body.categoryId, body.topicId]);
    } else if (action === 'update-profile') {
      await db.query('UPDATE forum_users SET username=?,email=?,bio=?,city=?,discord=?,phone=? WHERE id=?', [text(body.username, 32), text(body.email, 190), text(body.bio, 5000), text(body.city, 80), text(body.discord, 100), text(body.phone, 30), current.id]);
    } else if (action === 'update-user-tag') {
      if (!canAdmin(current)) return fail(response); await db.query('UPDATE forum_users SET tag_label=?,tag_color=? WHERE id=?', [text(body.tagLabel, 40) || null, text(body.tagColor, 20) || null, body.targetUserId]);
    } else return json(response, 400, { error: 'Невідома дія' });
    return json(response, 200, { ok: true });
  } catch (error) { console.error('forum API failed', error); return json(response, 503, { error: 'Форум тимчасово недоступний' }); }
}
