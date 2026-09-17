import crypto from 'node:crypto';
import { getDatabase, json } from './_db.js';

const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
export default async function handler(request, response) {
  if (request.method !== 'POST') return json(response, 405, { error: 'Метод не підтримується' });
  const { login, password, email } = request.body || {};
  if (!login?.trim() || !password || login.length > 32) return json(response, 400, { error: 'Введіть логін і пароль' });
  try {
    const db = getDatabase();
    if (request.body.action === 'register') {
      await db.query('INSERT INTO forum_users (username,email,password_hash) VALUES (?,?,?)',[login.trim(),email?.trim() || `${login.trim()}@prime-rp.store`,hash(password)]);
    }
    const [rows] = await db.query('SELECT id,username,email,role,created_at joined FROM forum_users WHERE username=? AND password_hash=? LIMIT 1',[login.trim(),hash(password)]);
    if (!rows[0]) return json(response,401,{error:'Неправильний логін або пароль'});
    const user = rows[0]; return json(response,200,{user:{id:String(user.id),username:user.username,email:user.email,role:user.role,joined:user.joined,avatar:user.username.slice(0,2).toUpperCase()}});
  } catch (error) { console.error('forum auth failed',error); return json(response,503,{error:'Авторизація форуму тимчасово недоступна'}); }
}
