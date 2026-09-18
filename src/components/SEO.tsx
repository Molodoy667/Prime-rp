import { useEffect } from 'react';

type SeoPage = { title:string; description:string; keywords?:string; ogImage?:string };
const pages: Record<string,SeoPage> = {
  '/forum': { title: 'Форум PRIME RP — спільнота гравців', description: 'Офіційний форум PRIME RP: новини, підтримка, обговорення та пропозиції гравців.' },
  '/account': { title: 'Особистий кабінет PRIME RP', description: 'Увійдіть до особистого кабінету PRIME RP, щоб переглянути свій ігровий профіль та статистику.' },
  '/rules': { title: 'Правила PRIME RP', description: 'Офіційні правила спільноти та ігрового проєкту PRIME RP.' },
  '/terms': { title: 'Умови користування — PRIME RP', description: 'Умови користування сайтом і сервісами PRIME RP.' },
  '/privacy': { title: 'Політика конфіденційності — PRIME RP', description: 'Політика конфіденційності офіційного сайту PRIME RP.' },
};

export default function SEO({ path }: { path: string }) {
  useEffect(() => {
    const fallback = pages[path] ?? (path === '/' ? { title: 'PRIME RP — Україна. Твоя історія. Твої правила.', description: 'PRIME RP — український MTA RolePlay-проєкт. Відкрий свій світ: українські міста, кар’єра, автомобілі та власна історія.' } : { title: 'Сторінку не знайдено — PRIME RP', description: 'Такої сторінки PRIME RP не існує.' });
    let page: SeoPage = fallback;
    const url = `https://prime-rp.store${path === '/' ? '/' : path}`;
    const setMeta = (selector: string, attribute: string, value: string) => { let node = document.querySelector<HTMLMetaElement>(selector); if (!node) { node = document.createElement('meta'); document.head.appendChild(node); } node.setAttribute(attribute, value); };
    const apply = (value: typeof page & { keywords?:string; ogImage?:string }) => { page = value; document.title = page.title; setMeta('meta[name="description"]','content',page.description); setMeta('meta[name="keywords"]','content',page.keywords || 'PRIME RP, MTA RolePlay, український MTA'); setMeta('meta[property="og:title"]','content',page.title); setMeta('meta[property="og:description"]','content',page.description); setMeta('meta[property="og:url"]','content',url); if (page.ogImage) setMeta('meta[property="og:image"]','content',page.ogImage); setMeta('meta[name="twitter:title"]','content',page.title); setMeta('meta[name="twitter:description"]','content',page.description); };
    apply(page);
    const controller = new AbortController();
    fetch(`/api/site-meta?path=${encodeURIComponent(path)}`, { signal: controller.signal, cache:'no-store' }).then(response => response.ok ? response.json() : null).then(data => { if (data?.seo?.[0]) apply(data.seo[0]); }).catch(() => undefined);
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]'); if (!canonical) { canonical=document.createElement('link'); canonical.rel='canonical'; document.head.appendChild(canonical); } canonical.href=url;
    return () => controller.abort();
  }, [path]);
  return null;
}
