import { FormEvent, useState } from 'react';
import { ArrowLeft, Coins, LogIn, LogOut, Mail, ShieldCheck, UserRound, Wallet } from 'lucide-react';
import { Brand } from '../ui';
import AdminPanel from './AdminPanel';

type PlayerRole = 'user' | 'moderator' | 'admin';
type Player = {
  id: number;
  nickname: string;
  login: string;
  email: string | null;
  role: PlayerRole;
  level: number;
  exp: number;
  online: number;
  money: number;
  donate: number;
};

const fmt = (value: number) => new Intl.NumberFormat('uk-UA').format(Number(value) || 0);
const roleLabel: Record<PlayerRole, string> = {
  user: 'ЗВИЧАЙНИЙ КОРИСТУВАЧ',
  moderator: 'МОДЕРАТОР',
  admin: 'АДМІНІСТРАТОР',
};
const playerStorageKey = 'prime-account-session';

function loadPlayer(): Player | null {
  try {
    const raw = localStorage.getItem(playerStorageKey);
    if (!raw) return null;
    const player = JSON.parse(raw) as Player;
    return player && typeof player.id === 'number' && typeof player.login === 'string' &&
      typeof player.nickname === 'string' &&
      (player.role === 'user' || player.role === 'moderator' || player.role === 'admin')
      ? player
      : null;
  } catch {
    return null;
  }
}

export default function Account() {
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [player, setPlayer] = useState<Player | null>(loadPlayer);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      if (mode === 'reset') {
        setMessage('Якщо таку електронну адресу зареєстровано, інструкції буде надіслано на неї.');
        return;
      }
      const response = await fetch('/api/auth-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не вдалося увійти');
      localStorage.setItem(playerStorageKey, JSON.stringify(data.player));
      setPlayer(data.player);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Помилка авторизації');
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem(playerStorageKey);
    setPlayer(null);
  }

  if (player) return (
    <div className="account-page">
      <header className="account-header"><Brand/><button className="account-back" onClick={logout}><LogOut size={16}/> ВИЙТИ</button></header>
      <main className="account-main">
        <div className="account-dashboard-heading"><div><p className="eyebrow"><span/> PERSONAL SPACE</p><h1>КАБІНЕТ <em>{player.nickname}</em></h1><p className="account-muted">Ігровий профіль PRIME RP та особиста статистика.</p></div><div className="account-level"><span>РІВЕНЬ</span><strong>{player.level}</strong></div></div>
        <section className="account-grid">
          <article className="account-card account-card-wide"><div className="account-card-icon"><UserRound/></div><div><span className="account-label">ІГРОВИЙ ПРОФІЛЬ</span><h2>{player.nickname}</h2><p>Логін: {player.login}<br/>Електронна пошта: {player.email || 'Не вказано'}<br/>Роль: <strong className="account-role">{roleLabel[player.role]}</strong></p></div><span className="account-status"><i/> {player.online ? 'У ГРІ' : 'НЕ В МЕРЕЖІ'}</span></article>
          <article className="account-card"><Wallet/><span className="account-label">ІГРОВІ ГРОШІ</span><strong>{fmt(player.money)} ₴</strong></article>
          <article className="account-card"><Coins/><span className="account-label">ДОНАТ-БАЛАНС</span><strong>{fmt(player.donate)}</strong></article>
          <article className="account-card"><ShieldCheck/><span className="account-label">ДОСВІД</span><strong>{fmt(player.exp)}</strong><small>до наступного рівня</small></article>
        </section>
        {player.role === 'admin' && <><section className="account-admin-panel"><div><p className="eyebrow"><span/> ADMIN CONTROL</p><h2>ПАНЕЛЬ АДМІНІСТРАТОРА</h2><p>Новини, SEO-теги та налаштування сайту керуються з цього розділу й зберігаються в базі даних.</p></div><div className="account-admin-roles"><div><strong>ADMIN</strong><span>повний доступ</span></div><div><strong>MODERATOR</strong><span>модерація</span></div><div><strong>USER</strong><span>базовий доступ</span></div></div></section><AdminPanel actorId={player.id}/></>}
        <a href="/" className="account-home"><ArrowLeft size={16}/> НА ГОЛОВНУ</a>
      </main>
    </div>
  );

  return <div className="account-page"><header className="account-header"><Brand/><a className="account-back" href="/"><ArrowLeft size={16}/> НА ГОЛОВНУ</a></header><main className="account-auth"><div className="account-auth-copy"><p className="eyebrow"><span/> PRIME RP COMMUNITY</p><h1>ТВОЯ ІСТОРІЯ<br/><em>ПОЧИНАЄТЬСЯ ТУТ</em></h1><p>Увійди до особистого кабінету, щоб переглянути профіль, прогрес та ігрові ресурси.</p></div><form className="account-form" onSubmit={submit}><div className="account-form-heading"><span>{mode === 'login' ? '01' : '02'}</span><h2>{mode === 'login' ? 'ВХІД ДО КАБІНЕТУ' : 'ВІДНОВЛЕННЯ'}</h2></div>{mode === 'login' ? <><label>ЛОГІН<input value={login} onChange={event => setLogin(event.target.value)} required/></label><label>ПАРОЛЬ<input type="password" value={password} onChange={event => setPassword(event.target.value)} required/></label></> : <label>ЕЛЕКТРОННА ПОШТА<input type="email" value={email} onChange={event => setEmail(event.target.value)} required/></label>}{error && <p className="account-error">{error}</p>}{message && <p className="account-message">{message}</p>}<button className="button gold account-submit" disabled={busy}>{busy ? 'ПЕРЕВІРЯЄМО…' : mode === 'login' ? <><LogIn size={17}/> УВІЙТИ</> : <><Mail size={17}/> НАДІСЛАТИ ПОСИЛАННЯ</>}</button><button type="button" className="account-switch" onClick={() => { setMode(mode === 'login' ? 'reset' : 'login'); setError(''); setMessage(''); }}>{mode === 'login' ? 'Забули пароль? Відновити через email' : 'Повернутися до входу'}</button></form></main><footer className="account-footer"><span>© 2026 PRIME RP</span><span>ТВІЙ СВІТ. ТВОЇ ПРАВИЛА.</span></footer></div>;
}
