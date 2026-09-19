import {useState} from 'react';
import {motion} from 'framer-motion';
import {MapPin,ArrowUpRight} from 'lucide-react';
import {cities} from '../../data/content';
import {ukrainePath,romaniaPath,projectCity} from '../../data/ukraine';
import {Reveal,SectionTitle} from '../ui';
import {useParallax} from '../../hooks/useParallax';

export default function UkraineMap(){
 const [selected,setSelected]=useState(cities[0]);const p=useParallax(9);
 const placed=cities.filter(c=>c.lat!==null&&c.lon!==null);
 return <Reveal id="map" className="ukraine-section wrap">
  <SectionTitle eyebrow="ЗНАЙОМІ КООРДИНАТИ. НОВІ МОЖЛИВОСТІ." title="ВІДКРИЙ СВОЮ" accent="УКРАЇНУ"><p className="small muted">Україна та Румунія<br/>Ілюстрації — концепти світу</p></SectionTitle>
  <div className="map-layout"><div className="map-stage" onPointerMove={p.onPointerMove} onPointerLeave={p.onPointerLeave}>
   <span className="map-coordinate">УКРАЇНА / РУМУНІЯ</span>
   <motion.div className="map-plane expanded-map" style={{rotateX:p.rotateX,rotateY:p.rotateY}}>
    <svg viewBox="0 0 860 620" aria-label="Мапа України, включно з Кримом, і сусідньої Румунії" role="img">
     <defs><pattern id="map-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#d6a84b" strokeWidth=".5" opacity=".16"/></pattern><linearGradient id="map-fill" x2="1" y2="1"><stop stopColor="#242a2d"/><stop offset="1" stopColor="#11151a"/></linearGradient></defs>
     <path d={romaniaPath} className={selected.id==='romania'?'romania-outline selected-country':'romania-outline'}/>
     <path d={ukrainePath} transform="translate(0,8)" fill="#050709" stroke="#52412c" strokeWidth="2"/>
     <path d={ukrainePath} fill="url(#map-fill)" stroke="#b18b46" strokeWidth="1.3"/>
     <path d={ukrainePath} fill="url(#map-grid)"/>
     {placed.map(c=>{const point=projectCity(c.lon!,c.lat!),label=c.labelPoint??point;return <g key={c.id} className={selected.id===c.id?'map-geo selected-geo':'map-geo'}><path d={`M${point.x},${point.y} L${label.x},${label.y}`} fill="none"/><circle cx={point.x} cy={point.y} r={selected.id===c.id?5:3}/></g>})}
    </svg>
    {placed.map(city=>{const pos=city.labelPoint??projectCity(city.lon!,city.lat!);return <button className={`map-pin ${selected.id===city.id?'selected':''}`} key={city.id} style={{left:`${pos.x/860*100}%`,top:`${pos.y/620*100}%`}} onMouseEnter={()=>setSelected(city)} onFocus={()=>setSelected(city)} onClick={()=>setSelected(city)} aria-pressed={selected.id===city.id} aria-label={`Локація ${city.name}`}><i/><span>{city.name}</span></button>})}
   </motion.div>
   <div className="map-location-list" aria-label="Усі локації">{cities.map(c=><button key={c.id} aria-pressed={selected.id===c.id} className={selected.id===c.id?'active':''} onClick={()=>setSelected(c)}>{c.name}{c.lat===null&&<span title="Місце на мапі уточнюється"> *</span>}</button>)}</div>
   <p className="map-footnote">* Михайлівка: розташування уточнюється. Географічні позначки приблизні.</p>
  </div>
  <article className="city-preview" aria-live="polite"><div className="city-image"><img src={selected.image} alt={`Концепт-ілюстрація для локації ${selected.name}, не ігровий скриншот`} style={{objectPosition:selected.position}}/><span>{selected.id==='romania'?'КРАЇНА':'ЛОКАЦІЯ PRIME'}</span></div><div className="city-content"><p className="gold-label"><MapPin size={14}/>{selected.country??'Україна'}</p><h3>{selected.name}</h3><p>{selected.description}</p>{selected.locationNote&&<p className="location-note">{selected.locationNote}</p>}<a className="text-link" href="#start">ТВОЯ ІСТОРІЯ ПОЧИНАЄТЬСЯ ТУТ<ArrowUpRight size={18}/></a></div></article></div>
 </Reveal>
}
