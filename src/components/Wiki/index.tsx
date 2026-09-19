import { useMemo, useState } from 'react';
import { CarFront, Search, UserRound } from 'lucide-react';
import { SectionTitle } from '../ui';
import { getVehicleName, skinIds, vehicleIds } from '../../data/catalog';

type WikiTab = 'skins' | 'vehicles';

export default function Wiki() {
  const [tab, setTab] = useState<WikiTab>('skins');
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase('uk-UA');
  const skins = useMemo(() => skinIds.filter(id => !normalizedQuery || (`${id} скін ${id}`).toLocaleLowerCase('uk-UA').includes(normalizedQuery)), [normalizedQuery]);
  const vehicles = useMemo(() => vehicleIds.filter(id => !normalizedQuery || `${id} ${getVehicleName(id)}`.toLocaleLowerCase('uk-UA').includes(normalizedQuery)), [normalizedQuery]);
  const visibleCount = tab === 'skins' ? skins.length : vehicles.length;

  return <section id="wiki" className="wiki wrap">
    <SectionTitle eyebrow="ДОВІДНИК PRIME RP" title="ВІКІ" accent="ІГРОВОГО СВІТУ">
      <p className="wiki-summary">{visibleCount} позицій знайдено</p>
    </SectionTitle>
    <div className="wiki-intro"><p>Каталог ігрових образів і транспорту PRIME RP з прив’язкою до ID моделі та оригінальних зображень.</p></div>
    <div className="wiki-toolbar">
      <div className="wiki-tabs" role="tablist" aria-label="Розділи вікі">
        <button className={tab === 'skins' ? 'active' : ''} onClick={() => setTab('skins')} role="tab" aria-selected={tab === 'skins'}><UserRound size={16}/> СКІНИ <small>{skinIds.length}</small></button>
        <button className={tab === 'vehicles' ? 'active' : ''} onClick={() => setTab('vehicles')} role="tab" aria-selected={tab === 'vehicles'}><CarFront size={16}/> МОДЕЛІ МАШИН <small>{vehicleIds.length}</small></button>
      </div>
      <label className="wiki-search"><Search size={17}/><span className="sr-only">Пошук у вікі</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder={tab === 'skins' ? 'Пошук за ID скіна…' : 'Пошук за ID або назвою машини…'} /></label>
    </div>
    <div className={`wiki-grid ${tab === 'vehicles' ? 'wiki-grid-vehicles' : 'wiki-grid-skins'}`}>
      {tab === 'skins' ? skins.map(id => <article className="wiki-card wiki-skin-card" key={`skin-${id}`}><div className="wiki-card-image"><img src={`/assets/skins/130x160/${id}.png`} alt={`Скін ${id}`} loading="lazy"/><span>#{id}</span></div><div><strong>Скін #{id}</strong><small>ID моделі: {id}</small></div></article>) : vehicles.map(id => <article className="wiki-card wiki-vehicle-card" key={`vehicle-${id}`}><div className="wiki-card-image"><img src={`/assets/vehicles/300x160/${id}.png`} alt={getVehicleName(id)} loading="lazy"/><span>#{id}</span></div><div><strong>{getVehicleName(id)}</strong><small>ID моделі: {id}</small></div></article>)}
    </div>
    {!visibleCount && <p className="wiki-empty">За цим запитом нічого не знайдено.</p>}
  </section>;
}
