export type ForumRole = 'admin' | 'moderator' | 'user';

export interface ForumUser { id: string; username: string; email: string; role: ForumRole; joined: string; avatar: string; bio?: string; city?: string; discord?: string; phone?: string; }
export interface ForumCategory { id: string; title: string; description: string; icon: string; color: string; topics: number; posts: number; parentId?: string; }
export interface ForumReply { id: string; topicId: string; author: string; role: ForumRole; body: string; createdAt: string; likes: number; edited?: boolean; }
export interface ForumTopic { id: string; categoryId: string; title: string; excerpt: string; author: string; authorRole: ForumRole; replies: number; views: number; createdAt: string; lastAuthor: string; lastAt: string; pinned?: boolean; locked?: boolean; tags: string[]; edited?: boolean; }

export const demoAccounts: Array<{label: string; login: string; password: string; role: ForumRole; description: string}> = [
  { label: 'Адміністратор', login: 'admin', password: 'admin123', role: 'admin', description: 'Повний доступ до панелі керування' },
  { label: 'Модератор', login: 'moderator', password: 'mod123', role: 'moderator', description: 'Модерація тем і відповідей' },
  { label: 'Користувач', login: 'player', password: 'player123', role: 'user', description: 'Створення тем і відповідей' },
];

export const forumCategories: ForumCategory[] = [
  { id: 'news', title: 'Новини та оголошення', description: 'Офіційні повідомлення команди PRIME RP', icon: 'megaphone', color: '#d6a84b', topics: 12, posts: 86 },
  { id: 'general', title: 'Загальний розділ', description: 'Спілкування гравців про світ PRIME RP', icon: 'messages', color: '#9da8b3', topics: 48, posts: 324 },
  { id: 'support', title: 'Підтримка гравців', description: 'Запитання, допомога та технічні звернення', icon: 'life-buoy', color: '#73a8d1', topics: 26, posts: 117 },
  { id: 'bug', title: 'Баги та пропозиції', description: 'Повідомлення про помилки й ідеї розвитку', icon: 'bug', color: '#c58a79', topics: 19, posts: 65 },
  { id: 'factions', title: 'Державні організації', description: 'Поліція, СБУ, ЗСУ, ДСНС та медицина', icon: 'shield', color: '#8bb58d', topics: 31, posts: 204 },
  { id: 'business', title: 'Бізнес та економіка', description: 'Підприємства, нерухомість і ринок', icon: 'briefcase', color: '#b89a6c', topics: 17, posts: 101 },
  { id: 'market', title: 'Ринок гравців', description: 'Купівля, продаж та обмін майна', icon: 'repeat', color: '#b49ac4', topics: 38, posts: 198 },
  { id: 'media', title: 'Медіа та творчість', description: 'Скріншоти, відео, історії та фан-контент', icon: 'camera', color: '#c89b72', topics: 22, posts: 95 },
];

export const forumTopics: ForumTopic[] = [
  { id: 'welcome', categoryId: 'news', title: 'Вітаємо у форумі PRIME RP', excerpt: 'Правила користування форумом, структура розділів і корисні посилання для старту.', author: 'PRIME Team', authorRole: 'admin', replies: 4, views: 1248, createdAt: 'сьогодні, 09:40', lastAuthor: 'PRIME Team', lastAt: 'сьогодні, 09:40', pinned: true, tags: ['важливо', 'офіційно'] },
  { id: 'start', categoryId: 'news', title: 'Як почати грати: короткий гайд', excerpt: 'Створення акаунта, встановлення лаунчера та перший вхід у світ PRIME RP.', author: 'PRIME Team', authorRole: 'admin', replies: 8, views: 890, createdAt: 'вчора, 18:22', lastAuthor: 'Alex_Morgan', lastAt: 'сьогодні, 08:12', pinned: true, tags: ['гайд'] },
  { id: 'intro', categoryId: 'general', title: 'Знайомство гравців PRIME RP', excerpt: 'Розкажіть, хто ви, який шлях плануєте обрати та з якого міста починається ваша історія.', author: 'Jack_Daniels', authorRole: 'user', replies: 23, views: 562, createdAt: 'сьогодні, 10:15', lastAuthor: 'Sofi_Bennet', lastAt: 'сьогодні, 11:02', tags: ['спілкування'] },
  { id: 'launch', categoryId: 'general', title: 'Який бізнес оберете на старті?', excerpt: 'Обговорення перших кроків у живій економіці та планів майбутніх підприємців.', author: 'North_Fray', authorRole: 'user', replies: 12, views: 318, createdAt: 'вчора, 20:44', lastAuthor: 'Vlad_Prime', lastAt: 'сьогодні, 09:18', tags: ['економіка'] },
  { id: 'connection', categoryId: 'support', title: 'Не можу підключитися до сервера', excerpt: 'Покрокова форма звернення до підтримки з діагностикою клієнта.', author: 'Maks_One', authorRole: 'user', replies: 6, views: 144, createdAt: 'сьогодні, 07:16', lastAuthor: 'Support_Anna', lastAt: 'сьогодні, 08:01', tags: ['допомога'] },
  { id: 'ideas', categoryId: 'bug', title: 'Пропозиції щодо міських подій', excerpt: 'Ідеї для фестивалів, перегонів, ярмарків та інших живих подій на карті.', author: 'Dima_Racer', authorRole: 'user', replies: 15, views: 402, createdAt: '16 вересня, 19:32', lastAuthor: 'moderator', lastAt: 'вчора, 12:05', tags: ['ідея'] },
  { id: 'police', categoryId: 'factions', title: 'Набір до державних структур', excerpt: 'Питання щодо кар’єри, вимог і внутрішнього шляху у фракціях.', author: 'Moderator', authorRole: 'moderator', replies: 9, views: 277, createdAt: '15 вересня, 15:25', lastAuthor: 'Ihor_Law', lastAt: '16 вересня, 21:43', tags: ['фракції'] },
  { id: 'market-car', categoryId: 'market', title: 'Продам преміальний седан', excerpt: 'Тестовий приклад оголошення на ринку майна гравців.', author: 'Lexus_ua', authorRole: 'user', replies: 3, views: 198, createdAt: '14 вересня, 14:09', lastAuthor: 'Lexus_ua', lastAt: '14 вересня, 15:20', locked: true, tags: ['транспорт'] },
];

export const forumReplies: ForumReply[] = [
  { id: 'r1', topicId: 'welcome', author: 'Moderator', role: 'moderator', body: 'Вітаємо у PRIME RP. Перед створенням теми обов’язково оберіть правильний розділ і перегляньте правила спільноти.', createdAt: 'сьогодні, 09:42', likes: 9 },
  { id: 'r2', topicId: 'welcome', author: 'Alex_Morgan', role: 'user', body: 'Дякую! Дуже атмосферно виглядає, чекаю на відкриття.', createdAt: 'сьогодні, 10:01', likes: 4 },
  { id: 'r3', topicId: 'intro', author: 'Sofi_Bennet', role: 'user', body: 'Планую почати з медицини, а потім відкрити власний бізнес у Києві.', createdAt: 'сьогодні, 11:02', likes: 6 },
];

export const roleLabel: Record<ForumRole, string> = { admin: 'АДМІНІСТРАТОР', moderator: 'МОДЕРАТОР', user: 'КОРИСТУВАЧ' };

export function loadForumUser(): ForumUser | null { try { const raw = localStorage.getItem('prime-forum-session'); return raw ? JSON.parse(raw) : null; } catch { return null; } }
export function saveForumUser(user: ForumUser | null) { if (user) localStorage.setItem('prime-forum-session', JSON.stringify(user)); else localStorage.removeItem('prime-forum-session'); }
export function mockLogin(login: string, password: string): ForumUser | null { const account = demoAccounts.find(item => item.login === login && item.password === password); return account ? { id: account.login, username: account.login === 'player' ? 'Player_Prime' : account.login === 'moderator' ? 'Moderator' : 'PRIME_Admin', email: `${account.login}@prime-rp.store`, role: account.role, joined: '16 вересня 2026', avatar: account.login.slice(0, 2).toUpperCase(), bio: 'Гравець PRIME RP', city: 'Київ', discord: `${account.login}#0001` } : null; }
