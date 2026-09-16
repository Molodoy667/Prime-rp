import { ArrowLeft, ArrowUpRight, Compass } from 'lucide-react';
import { Brand } from '../ui';

export default function NotFound() {
  return <div className="not-found-page">
    <header className="not-found-header">
      <Brand />
      <span className="not-found-code">ERROR / 404</span>
    </header>
    <main className="not-found-main">
      <div className="not-found-mark" aria-hidden="true"><span>404</span><Compass size={34} /></div>
      <p className="eyebrow"><span /> PRIME RP · СИСТЕМА НАВІГАЦІЇ</p>
      <h1>ЦЯ <em>СТОРІНКА</em><br />ЗАГУБИЛАСЯ</h1>
      <p className="not-found-copy">Схоже, цей маршрут ще не відкрито або його було переміщено. Повернімося туди, де починається твоя історія.</p>
      <div className="not-found-actions">
        <a className="button gold" href="/#home">НА ГОЛОВНУ <ArrowUpRight size={18} /></a>
        <a className="text-link" href="javascript:history.back()"><ArrowLeft size={17} /> ПОВЕРНУТИСЯ НАЗАД</a>
      </div>
      <p className="not-found-path">ROUTE NOT FOUND <span>·</span> {window.location.pathname}</p>
    </main>
    <footer className="not-found-footer">© 2026 PRIME RP <span>ТВОЯ ІСТОРІЯ. ТВОЇ ПРАВИЛА.</span></footer>
  </div>;
}
