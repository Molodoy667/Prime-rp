import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CarFront, Gem, Search, UserRound } from 'lucide-react';
import { SectionTitle } from '../ui';
import { getVehicleName, skinIds, vehicleIds } from '../../data/catalog';
import { getSkinName } from '../../data/skinNames';
import { accessoryFiles } from '../../data/accessories';
import { accessoryNames } from '../../data/accessoryNames';
import { getAccessoryId } from '../../data/accessoryIds';

type WikiTab = 'skins' | 'vehicles' | 'accessories';
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function getAccessoryName(file: string) {
  return accessoryNames[file] || file.replace(/\.png$/i, '').replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function Wiki() {
  const [tab, setTab] = useState<WikiTab>('skins');
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const normalizedQuery = query.trim().toLocaleLowerCase('uk-UA');
  const skins = useMemo(() => skinIds.filter(id => !normalizedQuery || (`${id} скін ${id}`).toLocaleLowerCase('uk-UA').includes(normalizedQuery)), [normalizedQuery]);
  const vehicles = useMemo(() => vehicleIds.filter(id => !normalizedQuery || `${id} ${getVehicleName(id)}`.toLocaleLowerCase('uk-UA').includes(normalizedQuery)), [normalizedQuery]);
  const accessories = useMemo(() => accessoryFiles.filter(file => !normalizedQuery || `${getAccessoryId(file) || ''} ${file} ${getAccessoryName(file)}`.toLocaleLowerCase('uk-UA').includes(normalizedQuery)), [normalizedQuery]);
  const visibleCount = tab === 'skins' ? skins.length : tab === 'vehicles' ? vehicles.length : accessories.length;
  const pageCount = Math.max(1, Math.ceil(visibleCount / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = currentPage * pageSize;
  const visibleSkins = skins.slice(pageStart, pageEnd);
  const visibleVehicles = vehicles.slice(pageStart, pageEnd);
  const visibleAccessories = accessories.slice(pageStart, pageEnd);
  const pageNumbers = useMemo<(number | 'ellipsis')[]>(() => {
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
    const pages = new Set<number>([1, pageCount, currentPage, currentPage - 1, currentPage + 1]);
    const ordered = [...pages].filter(number => number >= 1 && number <= pageCount).sort((a, b) => a - b);
    return ordered.flatMap((number, index) => index > 0 && number - ordered[index - 1] > 1 ? ['ellipsis', number] : [number]);
  }, [currentPage, pageCount]);

  useEffect(() => setPage(1), [tab, normalizedQuery, pageSize]);

  return <section id="wiki" className="wiki wrap">
    <SectionTitle eyebrow="ДОВІДНИК PRIME RP" title="ВІКІ" accent="ІГРОВОГО СВІТУ">
      <p className="wiki-summary">{visibleCount} позицій знайдено</p>
    </SectionTitle>
    <div className="wiki-intro"><p>Каталог ігрових образів і транспорту PRIME RP з прив’язкою до ID моделі та оригінальних зображень.</p></div>
    <div className="wiki-toolbar">
      <div className="wiki-tabs" role="tablist" aria-label="Розділи вікі">
        <button className={tab === 'skins' ? 'active' : ''} onClick={() => setTab('skins')} role="tab" aria-selected={tab === 'skins'}><UserRound size={16}/> СКІНИ <small>{skinIds.length}</small></button>
        <button className={tab === 'vehicles' ? 'active' : ''} onClick={() => setTab('vehicles')} role="tab" aria-selected={tab === 'vehicles'}><CarFront size={16}/> МОДЕЛІ МАШИН <small>{vehicleIds.length}</small></button>
        <button className={tab === 'accessories' ? 'active' : ''} onClick={() => setTab('accessories')} role="tab" aria-selected={tab === 'accessories'}><Gem size={16}/> АКСЕСУАРИ <small>{accessoryFiles.length}</small></button>
      </div>
      <label className="wiki-search"><Search size={17}/><span className="sr-only">Пошук у вікі</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder={tab === 'skins' ? 'Пошук за ID або назвою скіна…' : tab === 'vehicles' ? 'Пошук за ID або назвою машини…' : 'Пошук за назвою аксесуара…'} /></label>
      <label className="wiki-page-size"><span>ПОКАЗУВАТИ</span><select value={pageSize} onChange={event => setPageSize(Number(event.target.value))} aria-label="Кількість елементів на сторінці">{PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size}</option>)}</select><span>НА СТОРІНЦІ</span></label>
    </div>
    <div className={`wiki-grid ${tab === 'vehicles' ? 'wiki-grid-vehicles' : 'wiki-grid-skins'}`}>
      {tab === 'skins' ? visibleSkins.map(id => <article className="wiki-card wiki-skin-card" key={`skin-${id}`}><div className="wiki-card-image"><img src={`/assets/skins/130x160/${id}.png`} alt={getSkinName(id)} loading="lazy"/><span>#{id}</span></div><div><strong>{getSkinName(id)}</strong><small>ID моделі: {id}</small></div></article>) : tab === 'vehicles' ? visibleVehicles.map(id => <article className="wiki-card wiki-vehicle-card" key={`vehicle-${id}`}><div className="wiki-card-image"><img src={`/assets/vehicles/300x160/${id}.png`} alt={getVehicleName(id)} loading="lazy"/><span>#{id}</span></div><div><strong>{getVehicleName(id)}</strong><small>ID моделі: {id}</small></div></article>) : visibleAccessories.map(file => <article className="wiki-card wiki-accessory-card" key={`accessory-${file}`}><div className="wiki-card-image"><img src={`/assets/accessories/300x140/${encodeURIComponent(file)}`} alt={getAccessoryName(file)} loading="lazy"/><span>#{getAccessoryId(file) || '—'}</span></div><div><strong>{getAccessoryName(file)}</strong><small>ID аксесуара: {getAccessoryId(file) || 'не знайдено'}</small></div></article>)}
    </div>
    {!visibleCount && <p className="wiki-empty">За цим запитом нічого не знайдено.</p>}
    {visibleCount > pageSize && <nav className="wiki-pagination" aria-label="Сторінки вікі">
      <button className="wiki-pagination-arrow" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={currentPage === 1} aria-label="Попередня сторінка"><ArrowLeft size={15}/> <span>НАЗАД</span></button>
      <div className="wiki-pagination-pages">
        {pageNumbers.map((number, index) => number === 'ellipsis' ? <span key={`ellipsis-${index}`} className="wiki-pagination-ellipsis">…</span> : <button key={number} className={number === currentPage ? 'active' : ''} onClick={() => setPage(number)} aria-current={number === currentPage ? 'page' : undefined}>{number}</button>)}
      </div>
      <button className="wiki-pagination-arrow" onClick={() => setPage(value => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount} aria-label="Наступна сторінка"><span>ДАЛІ</span> <ArrowRight size={15}/></button>
    </nav>}
  </section>;
}
