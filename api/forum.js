import { getDatabase, json } from './_db.js';

const clean = (row) => ({ ...row, id: String(row.id), topics: Number(row.topics || 0), posts: Number(row.posts || 0), replies: Number(row.replies || 0), views: Number(row.views || 0), tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : (row.tags || []) });

export default async function handler(request, response) {
  try {
    const db = getDatabase();
    if (request.method === 'GET') {
      const [categories] = await db.query(`SELECT c.id,c.title,c.description,c.icon,c.color,COUNT(DISTINCT t.id) topics,COUNT(r.id) posts FROM forum_categories c LEFT JOIN forum_topics t ON t.category_id=c.id LEFT JOIN forum_replies r ON r.topic_id=t.id GROUP BY c.id ORDER BY c.sort_order,c.id`);
      const [topics] = await db.query(`SELECT t.id,t.category_id categoryId,t.title,t.body excerpt,u.username author,u.role authorRole,t.replies_count replies,t.views,t.created_at createdAt,la.username lastAuthor,t.last_at lastAt,t.pinned,t.locked,t.tags FROM forum_topics t JOIN forum_users u ON u.id=t.author_id JOIN forum_users la ON la.id=t.last_author ORDER BY t.pinned DESC,t.last_at DESC`);
      const [replies] = await db.query(`SELECT r.id,r.topic_id topicId,u.username author,u.role,r.body,r.created_at createdAt,r.likes FROM forum_replies r JOIN forum_users u ON u.id=r.author_id ORDER BY r.created_at`);
      return json(response, 200, { categories: categories.map(clean), topics: topics.map(clean), replies: replies.map(clean) });
    }
    if (request.method === 'POST') {
      const { action, userId, categoryId, title, body, topicId } = request.body || {};
      if (!userId || !body?.trim() && action !== 'create-category') return json(response, 400, { error: 'Потрібні обов’язкові дані' });
      if (action === 'create-category') { await db.query('INSERT INTO forum_categories (title,description,icon,color) VALUES (?,?,?,?)',[title?.trim(),body?.trim() || 'Розділ спільноти','messages','#d6a84b']); return json(response,201,{ok:true}); }
      if (action === 'create-topic') { await db.query('INSERT INTO forum_topics (category_id,author_id,title,body,tags,last_author,last_at) VALUES (?,?,?,?,?,?,NOW())',[categoryId,userId,title?.trim(),body.trim(),'["нова тема"]',userId]); return json(response,201,{ok:true}); }
      if (action === 'create-reply') { await db.query('INSERT INTO forum_replies (topic_id,author_id,body) VALUES (?,?,?)',[topicId,userId,body.trim()]); await db.query('UPDATE forum_topics SET replies_count=replies_count+1,last_author=?,last_at=NOW() WHERE id=?',[userId,topicId]); return json(response,201,{ok:true}); }
      return json(response,400,{error:'Невідома дія'});
    }
    return json(response,405,{error:'Метод не підтримується'});
  } catch (error) { console.error('forum API failed', error); return json(response,503,{error:'Форум тимчасово недоступний'}); }
}
