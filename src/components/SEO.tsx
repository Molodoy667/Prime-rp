import { useEffect } from 'react';

const pages: Record<string,{title:string;description:string}> = {
  '/forum': { title: 'Форум PRIME RP — спільнота гравців', description: 'Офіційний форум PRIME RP: новини, підтримка, обговорення та пропозиції гравців.' },
  '/account': { title: 'Особистий кабінет PRIME RP', description: 'Увійдіть до особистого кабінету PRIME RP, щоб переглянути свій ігровий профіль та статистику.' },
  '/rules': { title: 'Правила PRIME RP', description: 'Офіційні правила спільноти та ігрового проєкту PRIME RP.' },
  '/terms': { title: 'Умови користування — PRIME RP', description: 'Умови користування сайтом і сервісами PRIME RP.' },
  '/privacy': { title: 'Політика конфіденційності — PRIME RP', description: 'Політика конфіденційності офіційного сайту PRIME RP.' },
};

export default function SEO({ path }: { path: string }) {
  useEffect(() => {
    const page = pages[path] ?? { title: 'Сторінку не знайдено — PRIME RP', description: 'Такої сторінки PRIME RP не існує.' };
    const url = `https://prime-rp.store${path === '/' ? '/' : path}`;
    document.title = page.title;
    const setMeta = (selector: string, attribute: string, value: string) => { let node = document.querySelector<HTMLMetaElement>(selector); if (!node) { node = document.createElement('meta'); document.head.appendChild(node); } node.setAttribute(attribute, value); };
    setMeta('meta[name="description"]','content',page.description);
    setMeta('meta[property="og:title"]','content',page.title); setMeta('meta[property="og:description"]','content',page.description); setMeta('meta[property="og:url"]','content',url);
    setMeta('meta[name="twitter:title"]','content',page.title); setMeta('meta[name="twitter:description"]','content',page.description);
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]'); if (!canonical) { canonical=document.createElement('link'); canonical.rel='canonical'; document.head.appendChild(canonical); } canonical.href=url;
  }, [path]);
  return null;
}
