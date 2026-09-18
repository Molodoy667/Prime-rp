import { FormEvent, useState } from 'react';
import { ArrowLeft, CalendarDays, CarFront, Coins, Crown, HeartPulse, Home, LogIn, LogOut, Mail, ShieldCheck, Star, UserRound, Wallet } from 'lucide-react';
import '../../styles/account-details.css';
import { Brand } from '../ui';
import AdminPanel from './AdminPanel';

type PlayerRole = 'user' | 'moderator' | 'admin';
type Vehicle = { id: number; model: number; health?: number; fuel?: number; mileage?: number; number_plate?: string | null; creation_date?: number | null };
type Apartment = { id: number; number: number; meter_type?: number; sale_state?: number; paid_days?: number; time_to_pay?: number; paid_upgrade?: number };
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
  premium_time_left?: number | null;
  premium_total?: number;
  premium_transactions?: number;
  premium_last_date?: number;
  donate_total?: number;
  donate_transactions?: number;
  donate_last_date?: number;
  health?: number;
  calories?: number;
  armor?: number;
  phone?: string | null;
  phone_balance?: number;
  start_city?: number;
  hometown?: number;
  gender?: number;
  skin?: number | null;
  car_slots?: number;
  social_rating?: number;
  faction_id?: number;
  faction_level?: number;
  faction_exp?: number;
  faction_warns?: number;
  clan_id?: string | null;
  clan_exp?: number;
  clan_rank?: number;
  clan_role?: number;
  job_class?: string | null;
  job_id?: string | null;
  military_level?: number;
  military_exp?: number;
  subscription_time_left?: number;
  subscription_total?: number;
  subscription_transactions?: number;
  subscription_last_date?: number;
  business_coins?: number;
  cinema_balance?: number;
  playing_time?: number;
  reg_date?: number;
  last_date?: number;
  last_enter_date?: number;
  birthday?: number;
  sessions_counter?: number;
  housing_count?: number;
  housing_numbers?: string | null;
  vehicles_count?: number;
  vehicles?: Vehicle[];
  apartments?: Apartment[];
};

const fmt = (value: number) => new Intl.NumberFormat('uk-UA').format(Number(value) || 0);
const dateTime = (value?: number | null) => { const number = Number(value); if (!number) return 'Немає даних'; const date = new Date(number < 100000000000 ? number * 1000 : number); return Number.isNaN(date.getTime()) ? 'Немає даних' : new Intl.DateTimeFormat('uk-UA', { dateStyle:'medium', timeStyle:'short' }).format(date); };
const timeLeft = (value?: number | null) => { const seconds = Number(value) || 0; if (seconds <= 0) return 'Неактивна'; const days = Math.floor(seconds / 86400); const hours = Math.floor((seconds % 86400) / 3600); return days ? `${days} дн. ${hours} год.` : `${hours} год.`; };
const valueOrDash = (value?: number | string | null) => value === null || value === undefined || value === '' ? '—' : String(value);
const skinImage = (skin?: number | null) => { const id = Number(skin); return Number.isInteger(id) && id > 0 ? `/assets/skins/130x160/${id}.png` : null; };
const vehicleImage = (model?: number | null) => { const id = Number(model); return Number.isInteger(id) && id > 0 ? `/assets/vehicles/300x160/${id}.png` : null; };
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
          <article className="account-card account-card-wide"><div className="account-card-icon account-avatar-frame">{skinImage(player.skin) ? <img src={skinImage(player.skin)!} alt={`Скін ${player.skin}`}/> : <UserRound/>}</div><div><span className="account-label">ІГРОВИЙ ПРОФІЛЬ</span><h2>{player.nickname}</h2><p>Логін: {player.login}<br/>Електронна пошта: {player.email || 'Не вказано'}<br/>Роль: <strong className="account-role">{roleLabel[player.role]}</strong></p></div><span className="account-status"><i/> {player.online ? 'У ГРІ' : 'НЕ В МЕРЕЖІ'}</span></article>
          <article className="account-card"><Wallet/><span className="account-label">ІГРОВІ ГРОШІ</span><strong>{fmt(player.money)} ₴</strong></article>
          <article className="account-card"><Coins/><span className="account-label">ДОНАТ-БАЛАНС</span><strong>{fmt(player.donate)}</strong></article>
          <article className="account-card"><ShieldCheck/><span className="account-label">ДОСВІД</span><strong>{fmt(player.exp)}</strong><small>до наступного рівня</small></article>
        </section>
        <section className="account-detail-grid">
          <article className="account-detail-card"><Crown/><span className="account-label">ПРЕМІУМ</span><strong>{timeLeft(player.premium_time_left)}</strong><small>до завершення підписки</small></article>
          <article className="account-detail-card"><Home/><span className="account-label">ЖИТЛО</span><strong>{fmt(player.housing_count || 0)}</strong><small>об’єктів нерухомості</small></article>
          <article className="account-detail-card"><CarFront/><span className="account-label">ТРАНСПОРТ</span><strong>{fmt(player.vehicles_count || 0)}</strong><small>{fmt(player.car_slots || 0)} доступних слотів</small></article>
          <article className="account-detail-card"><CalendarDays/><span className="account-label">ОСТАННІЙ ВХІД</span><strong className="account-date">{dateTime(player.last_enter_date || player.last_date)}</strong><small>останнє збереження профілю</small></article>
          <article className="account-detail-card"><HeartPulse/><span className="account-label">СТАН ПЕРСОНАЖА</span><strong>{Math.round(Number(player.health) || 0)} HP</strong><small>{Math.round(Number(player.armor) || 0)} броні · {Math.round(Number(player.calories) || 0)}% ситості</small></article>
          <article className="account-detail-card"><Star/><span className="account-label">РЕЙТИНГ</span><strong>{fmt(player.social_rating || 0)}</strong><small>соціальний рейтинг</small></article>
        </section>
        <section className="account-information">
          <div className="account-information-column"><h2>ПРОФІЛЬ ГРАВЦЯ</h2><dl>
            <dt>Реєстрація</dt><dd>{dateTime(player.reg_date)}</dd>
            <dt>День народження</dt><dd>{dateTime(player.birthday)}</dd>
            <dt>Рідне місто</dt><dd>Місто #{valueOrDash(player.hometown)}</dd>
            <dt>Місто старту</dt><dd>Місто #{valueOrDash(player.start_city)}</dd>
            <dt>Нерухомість</dt><dd>{player.housing_numbers || 'Не зареєстровано'}</dd>
            <dt>Стать / скін</dt><dd>{valueOrDash(player.gender)} / {valueOrDash(player.skin)}</dd>
            <dt>Телефон</dt><dd>{player.phone || 'Не вказано'}</dd>
            <dt>Баланс телефону</dt><dd>{fmt(player.phone_balance || 0)}</dd>
            <dt>Ігровий час</dt><dd>{fmt(player.playing_time || 0)} од.</dd>
            <dt>Сесій</dt><dd>{fmt(player.sessions_counter || 0)}</dd>
          </dl></div>
          <div className="account-information-column"><h2>ПРОГРЕС І СЕРВІСИ</h2><dl>
            <dt>Фракція</dt><dd>{player.faction_id ? `#${player.faction_id}, рівень ${player.faction_level || 0}` : 'Не перебуває'}</dd>
            <dt>Досвід фракції</dt><dd>{fmt(player.faction_exp || 0)}</dd>
            <dt>Попередження фракції</dt><dd>{fmt(player.faction_warns || 0)}</dd>
            <dt>Клан</dt><dd>{player.clan_id || 'Не перебуває'}</dd>
            <dt>Робота</dt><dd>{player.job_class || player.job_id || 'Не обрано'}</dd>
            <dt>Військовий рівень</dt><dd>{fmt(player.military_level || 0)} · {fmt(player.military_exp || 0)} XP</dd>
            <dt>Преміум придбано</dt><dd>{fmt(player.premium_total || 0)} · операцій: {fmt(player.premium_transactions || 0)}</dd>
            <dt>Донат за весь час</dt><dd>{fmt(player.donate_total || 0)} · операцій: {fmt(player.donate_transactions || 0)}</dd>
            <dt>Підписка</dt><dd>{timeLeft(player.subscription_time_left)} · баланс: {fmt(player.subscription_total || 0)}</dd>
            <dt>Бізнес-монети / кіно</dt><dd>{fmt(player.business_coins || 0)} / {fmt(player.cinema_balance || 0)}</dd>
          </dl></div>
        </section>
        <section className="account-assets-grid">
          <div className="account-asset-panel"><div className="account-asset-heading"><div><span className="account-label">ГАРАЖ</span><h2>МОЇ МАШИНИ</h2></div><strong>{fmt(player.vehicles?.length || 0)}</strong></div>{player.vehicles?.length ? <div className="account-vehicle-list">{player.vehicles.map(vehicle => <article className="account-vehicle-card" key={vehicle.id}>{vehicleImage(vehicle.model) ? <img src={vehicleImage(vehicle.model)!} alt={`Модель ${vehicle.model}`}/> : <div className="account-vehicle-placeholder"><CarFront/></div>}<div><strong>Модель #{vehicle.model}</strong><small>Номер: {vehicle.number_plate || 'Не встановлено'}</small><small>Стан: {Math.round(Number(vehicle.health) || 0)} · Паливо: {Math.round(Number(vehicle.fuel) || 0)}%</small><small>Пробіг: {fmt(vehicle.mileage || 0)} км</small></div></article>)}</div> : <p className="account-empty-assets">У власності немає зареєстрованих машин.</p>}</div>
          <div className="account-asset-panel"><div className="account-asset-heading"><div><span className="account-label">НЕРУХОМІСТЬ</span><h2>МОЄ ЖИТЛО</h2></div><strong>{fmt(player.apartments?.length || player.housing_count || 0)}</strong></div>{player.apartments?.length ? <div className="account-housing-list">{player.apartments.map(apartment => <article className="account-housing-card" key={apartment.id}><Home/><div><strong>Квартира №{apartment.number}</strong><small>Оплачена до: {dateTime(apartment.time_to_pay)}</small><small>Оплачено днів: {fmt(apartment.paid_days || 0)} · покращення: {fmt(apartment.paid_upgrade || 0)}</small></div></article>)}</div> : <p className="account-empty-assets">Зареєстрованої нерухомості немає.</p>}</div>
        </section>
        {player.role === 'admin' && <><section className="account-admin-panel"><div><p className="eyebrow"><span/> ADMIN CONTROL</p><h2>ПАНЕЛЬ АДМІНІСТРАТОРА</h2><p>Новини, SEO-теги та налаштування сайту керуються з цього розділу й зберігаються в базі даних.</p></div><div className="account-admin-roles"><div><strong>ADMIN</strong><span>повний доступ</span></div><div><strong>MODERATOR</strong><span>модерація</span></div><div><strong>USER</strong><span>базовий доступ</span></div></div></section><AdminPanel actorId={player.id}/></>}
        <a href="/" className="account-home"><ArrowLeft size={16}/> НА ГОЛОВНУ</a>
      </main>
    </div>
  );

  return <div className="account-page"><header className="account-header"><Brand/><a className="account-back" href="/"><ArrowLeft size={16}/> НА ГОЛОВНУ</a></header><main className="account-auth"><div className="account-auth-copy"><p className="eyebrow"><span/> PRIME RP COMMUNITY</p><h1>ТВОЯ ІСТОРІЯ<br/><em>ПОЧИНАЄТЬСЯ ТУТ</em></h1><p>Увійди до особистого кабінету, щоб переглянути профіль, прогрес та ігрові ресурси.</p></div><form className="account-form" onSubmit={submit}><div className="account-form-heading"><span>{mode === 'login' ? '01' : '02'}</span><h2>{mode === 'login' ? 'ВХІД ДО КАБІНЕТУ' : 'ВІДНОВЛЕННЯ'}</h2></div>{mode === 'login' ? <><label>ЛОГІН<input value={login} onChange={event => setLogin(event.target.value)} required/></label><label>ПАРОЛЬ<input type="password" value={password} onChange={event => setPassword(event.target.value)} required/></label></> : <label>ЕЛЕКТРОННА ПОШТА<input type="email" value={email} onChange={event => setEmail(event.target.value)} required/></label>}{error && <p className="account-error">{error}</p>}{message && <p className="account-message">{message}</p>}<button className="button gold account-submit" disabled={busy}>{busy ? 'ПЕРЕВІРЯЄМО…' : mode === 'login' ? <><LogIn size={17}/> УВІЙТИ</> : <><Mail size={17}/> НАДІСЛАТИ ПОСИЛАННЯ</>}</button><button type="button" className="account-switch" onClick={() => { setMode(mode === 'login' ? 'reset' : 'login'); setError(''); setMessage(''); }}>{mode === 'login' ? 'Забули пароль? Відновити через email' : 'Повернутися до входу'}</button></form></main><footer className="account-footer"><span>© 2026 PRIME RP</span><span>ТВІЙ СВІТ. ТВОЇ ПРАВИЛА.</span></footer></div>;
}
