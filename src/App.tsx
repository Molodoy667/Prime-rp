import { lazy, Suspense, useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import ServerStatus from './components/ServerStatus';
import Features from './components/Features';
import Careers from './components/Careers';
import Vehicles from './components/Vehicles';
import Economy from './components/Features/Economy';
import HowToStart from './components/HowToStart';
import News from './components/News';
import Gallery from './components/Gallery';
import FinalCTA from './components/FinalCTA';
import DonateShop from './components/DonateShop';
import Footer from './components/Footer';
import { OverlayContext, type OverlayContent } from './components/ui';
import { getNews, getSiteSettings } from './data/api';
import { siteConfig } from './config/site';
import type { NewsItem } from './types';
import { useServerStatus } from './hooks/useServerStatus';
const UkraineMap = lazy(() => import('./components/UkraineMap'));
const Overlay = lazy(() => import('./components/ui/Overlay'));
export default function App() {
  const { servers, error: serverError, loading: serverLoading, refresh } = useServerStatus();
  const [news, setNews] = useState<NewsItem[]>([]); const [newsError, setNewsError] = useState('');
  const [launcherUrl, setLauncherUrl] = useState(siteConfig.launcherUrl); const [overlay, setOverlay] = useState<OverlayContent | null>(null);
  useEffect(() => { const controller = new AbortController(); getNews(controller.signal).then(setNews).catch(error => { if (error.name !== 'AbortError') setNewsError('Новини тимчасово недоступні.'); }); getSiteSettings(controller.signal).then(settings => { if (settings.download_url) setLauncherUrl(settings.download_url); }).catch(() => undefined); return () => controller.abort(); }, []);
  return <MotionConfig reducedMotion="user"><OverlayContext.Provider value={setOverlay}><a href="#main" className="skip-link">Перейти до вмісту</a><Header /><main id="main"><Hero servers={servers} /><ServerStatus servers={servers} error={serverError} loading={serverLoading} onRefresh={refresh} /><Features /><Careers /><Vehicles /><Economy /><Suspense fallback={<div className="map-placeholder" />}><UkraineMap /></Suspense><HowToStart launcherUrl={launcherUrl} /><News items={news} error={newsError} /><DonateShop /><Gallery /><FinalCTA /></main><Footer />{overlay && <Suspense fallback={null}><Overlay content={overlay} onClose={() => setOverlay(null)} /></Suspense>}</OverlayContext.Provider></MotionConfig>;
}
