import {motion} from 'framer-motion';
import {ArrowUpRight,Radio,TowerControl,RefreshCw} from 'lucide-react';
import {Reveal,SectionTitle} from '../ui';
import type {Server} from '../../types';
import {siteConfig} from '../../config/site';
const clock=(date?:string)=>date&&Number.isFinite(Date.parse(date))?new Date(date).toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):null;
export default function ServerStatus({servers,error,loading,onRefresh}:{servers:Server[];error:string;loading:boolean;onRefresh:()=>void}){
 const primary=servers.find(s=>s.id==='prime-1');
 const items=servers.length?servers:[{id:'prime-1',name:siteConfig.serverAddress,subtitle:'Сервер PRIME',status:'unknown',players:null,capacity:null,connectUrl:`mtasa://${siteConfig.serverAddress}`} as Server];
 return <Reveal id="servers" className="servers wrap"><SectionTitle eyebrow="ТВОЯ НОВА ІСТОРІЯ" title="ОБЕРИ СВІЙ" accent="СВІТ"><div className="server-monitor-caption"><p className="small muted">Оновлення статусу щохвилини<br/>Можлива коротка затримка даних.</p><button className="server-refresh" onClick={onRefresh} disabled={loading}><RefreshCw size={13} style={{display:'inline',marginRight:8}}/>{loading?'Перевіряємо…':'Оновити статус'}</button></div></SectionTitle>
 {error&&<p className="server-error" role="status">{error}</p>}
 <div className="server-grid">{items.map((s,i)=>{const hasCount=s.players!==null&&s.capacity!==null&&s.capacity>0&&s.status==='online';return <article className={`server-card ${s.status==='soon'?'soon':''}`} key={s.id}>
  <span className="server-symbol">{i===0?<Radio/>:<TowerControl/>}</span><div className="server-info"><div className="server-title"><h3>{s.name}</h3><span className={`server-state ${s.status}`}>{s.status==='online'?<><i className="status-dot"/>ONLINE</>:s.status==='soon'?'COMING SOON':s.status==='offline'?'НЕ ВІДПОВІДАЄ':loading?'ПЕРЕВІРЯЄМО…':'СТАТУС НЕВІДОМИЙ'}</span></div><p>{s.subtitle}</p>
  {s.status!=='soon'&&<><div className="server-count"><strong>{hasCount?s.players:'—'} <span>/ {s.capacity??'—'}</span></strong><span>ГРАВЦІВ</span></div>{hasCount&&<div className="progress" role="progressbar" aria-label="Заповненість сервера" aria-valuenow={s.players!} aria-valuemax={s.capacity!} aria-valuemin={0}><motion.span initial={{width:0}} animate={{width:`${Math.min(100,s.players!/s.capacity!*100)}%`}} transition={{duration:.6}}/></div>}<p className="server-update">{s.statusMessage??'Статус сервера оновлюється автоматично.'}{clock(s.sourceUpdatedAt)&&<><br/>Оновлено: {clock(s.sourceUpdatedAt)}</>}</p></>}
 </div>{s.status!=='soon'?<a className="server-join" aria-label={`Приєднатися до ${s.name}`} href={s.connectUrl}><span>ПРИЄДНАТИСЯ</span><ArrowUpRight/></a>:<span className="coming-note">НОВІ ГОРИЗОНТИ<br/>ПОПЕРЕДУ</span>}</article>})}</div>
 <p className="server-update">{clock(primary?.checkedAt)?`Перевірено о ${clock(primary?.checkedAt)}.`:'Стан перевіряється автоматично.'}</p>
 </Reveal>
}
