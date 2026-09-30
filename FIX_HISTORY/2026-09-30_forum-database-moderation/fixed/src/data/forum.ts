export type ForumRole = 'admin' | 'moderator' | 'user';

export interface ForumUser {
  id: string; username: string; email: string; role: ForumRole; joined: string; avatar: string;
  tagLabel?: string; tagColor?: string; bio?: string; city?: string; discord?: string; phone?: string;
}
export interface ForumCategory { id: string; title: string; description: string; icon: string; color: string; topics: number; posts: number; parentId?: string; }
export interface ForumReply { id: string; topicId: string; author: string; authorId?: string; role: ForumRole; authorTagLabel?: string; authorTagColor?: string; body: string; createdAt: string; likes: number; edited?: boolean; }
export interface ForumTopic {
  id: string; categoryId: string; title: string; excerpt: string; author: string; authorId?: string; authorRole: ForumRole;
  authorTagLabel?: string; authorTagColor?: string; replies: number; views: number; createdAt: string; lastAuthor: string;
  lastAuthorRole?: ForumRole; lastAuthorTagLabel?: string; lastAuthorTagColor?: string; lastAt: string;
  pinned?: boolean; locked?: boolean; tags: string[]; edited?: boolean;
}

export const roleLabel: Record<ForumRole, string> = { admin: 'АДМІНІСТРАТОР', moderator: 'МОДЕРАТОР', user: 'КОРИСТУВАЧ' };

export function loadForumUser(): ForumUser | null {
  try { const raw = localStorage.getItem('prime-forum-session'); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function saveForumUser(user: ForumUser | null) {
  if (user) localStorage.setItem('prime-forum-session', JSON.stringify(user));
  else localStorage.removeItem('prime-forum-session');
}
