import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Coins, Gift, History, LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { Brand } from '../ui';
import '../../styles/roulette.css';

type Quality = 'white'|'blue'|'purple'|'red'|'yellow';
type Prize = { id:number; quality:Quality; qualityLabel:string; title:string; rewardType:string; rewardValue:string; imageUrl:string|null; weight:number; isActive:boolean; sortOrder:number };
type HistoryItem = { id:number; quality:Quality; title:string; imageUrl:string|null; createdAt:string };
const qualityOrder:Quality[] = ['yellow','red','purple','blue','white'];
const qualityChance:Record<Quality,string> = { white:'55%',blue:'25%',purple:'12%',red:'6%',yellow:'2%' };

function session(){try{const value=JSON.parse(localStorage.getItem('prime-account-session')||'null');return value&&Number.isInteger(value.id)?value:null}catch{return null}}
function imageFor(prize:Prize|HistoryItem){return prize.imageUrl||'/assets/official-brand-original.webp'}

export default function Roulette(){
  const [player] = useState(session);
  const [prizes,setPrizes] = useState<Prize[]>([]);
  const [history,setHistory] = useState<HistoryItem[]>([]);
  const [freeSpins,setFreeSpins] = useState(0);
  const [balance,setBalance] = useState(0);
  const [selected,setSelected] = useState<Prize|null>(null);
  const [rolling,setRolling] = useState(false);
  const [error,setError] = useState('');
  const [loaded,setLoaded] = useState(false);

  async function load(){if(!player)return;try{const response=await fetch(`/api/roulette?playerId=${player.id}`);const data=await response.json();if(!response.ok)throw new Error(data.error||'Рулетка недоступна');setPrizes(data.prizes||[]);setHistory(data.history||[]);setFreeSpins(Number(data.freeSpins)||0);setBalance(Number(data.balance)||0);setError('')}catch(value){setError(value instanceof Error?value.message:'Рулетка недоступна')}finally{setLoaded(true)}}
  useEffect(()=>{load()},[player?.id]);
  const grouped=useMemo(()=>qualityOrder.map(quality=>({quality,items:prizes.filter(prize=>prize.quality===quality)})).filter(group=>group.items.length),[prizes]);
  async function spin(){if(!player||rolling||(!freeSpins&&!balance))return;setRolling(true);setError('');try{const response=await fetch('/api/roulette',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'spin',playerId:player.id})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Не вдалося обертати рулетку');setFreeSpins(Number(data.freeSpins)||0);setBalance(Number(data.balance)||0);setTimeout(()=>{setSelected(data.prize);setHistory(current=>[{...data.prize,createdAt:new Date().toISOString()},...current].slice(0,30));setRolling(false)},1100)}catch(value){setError(value instanceof Error?value.message:'Не вдалося обертати рулетку');setRolling(false)}}
  if(!player)return <div className="roulette-guest"><Brand/><Gift size={42}/><h1>РУЛЕТКА ДОСТУПНА В КАБІНЕТІ</h1><p>Увійдіть до особистого кабінету, щоб отримувати призи та бачити історію виграшів.</p><a className="button gold" href="/account">УВІЙТИ ДО КАБІНЕТУ</a></div>;
  return <div className="roulette-page"><header className="roulette-header"><a href="/account" className="roulette-back"><ArrowLeft size={16}/> КАБІНЕТ</a><Brand/><span className="roulette-player">{player.nickname}</span></header><main className="roulette-main"><div className="roulette-heading"><div><p className="eyebrow"><span/> PRIME REWARDS</p><h1>РУЛЕТКА</h1><p>Випробуйте удачу та отримуйте нагороди зі світу PRIME RP.</p></div><div className="roulette-wallet"><span>ВАШ БАЛАНС</span><strong><Coins size={20}/> {balance}</strong></div></div>{error&&<p className="roulette-error">{error}</p>}<section className="roulette-machine"><div className="roulette-pointer"/><div className={`roulette-track ${rolling?'rolling':''}`}>{(selected?[selected,...prizes]:prizes).slice(0,7).map((prize,index)=><article className={`roulette-result-card quality-${prize.quality}`} key={`${prize.id}-${index}`}><img src={imageFor(prize)} alt=""/><strong>{prize.title}</strong></article>)}</div><div className="roulette-center"><Sparkles size={27}/><span>{rolling?'ОБЕРТАЄМО…':selected?selected.title:'ОБЕРІТЬ НАГОРОДУ'}</span></div></section><div className="roulette-actions"><div className="roulette-free"><Gift size={18}/><span>Безкоштовних обертань<strong>{freeSpins}</strong></span></div><button className="button gold roulette-spin" disabled={rolling||(!freeSpins&&!balance)} onClick={spin}>{rolling?<LoaderCircle className="spin-icon" size={18}/>:<Sparkles size={18}/>} {freeSpins?'КРУТИТИ БЕЗКОШТОВНО':'КРУТИТИ РУЛЕТКУ'}</button><span className="roulette-hint"><ShieldCheck size={15}/> Шанси визначені якістю призу</span></div><section className="roulette-history"><div className="roulette-section-title"><h2><History size={20}/> ОСТАННІ ВИГРАШІ</h2><a href="#history">Вся історія</a></div><div className="roulette-history-row">{history.length?history.slice(0,8).map(item=><article className={`history-card quality-${item.quality}`} key={item.id}><img src={imageFor(item)} alt=""/><strong>{item.title}</strong></article>):<p>Ви ще не вигравали призів.</p>}</div></section><section className="roulette-prizes"><div className="roulette-section-title"><h2>ЙМОВІРНИЙ ДРОП</h2><span>Білий має найбільший шанс, жовтий — найменший</span></div>{loaded?grouped.map(group=><div className={`prize-quality quality-${group.quality}`} key={group.quality}><div className="quality-heading"><h3>{group.items[0].qualityLabel}</h3><b>{qualityChance[group.quality]}</b></div><div className="prize-grid">{group.items.map(prize=><article className="prize-card" key={prize.id}><img src={imageFor(prize)} alt=""/><strong>{prize.title}</strong><small>{prize.rewardType}</small></article>)}</div></div>):<p>Завантаження призів…</p>}</section></main></div>;
}
