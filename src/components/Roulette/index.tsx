import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Coins, Gift, History, LoaderCircle, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Brand } from '../ui';
import '../../styles/roulette.css';

type Quality = 'white'|'blue'|'purple'|'red'|'yellow';
type Prize = { id:number; quality:Quality; qualityLabel:string; title:string; rewardType:string; rewardValue:string; imageUrl:string|null; weight:number; isActive:boolean; sortOrder:number };
type HistoryItem = { id:number; quality:Quality; title:string; imageUrl:string|null; createdAt:string };
type WinItem = HistoryItem & { winId?:number; rewardType?:string; rewardValue?:string; sellPrice?:number; status?:'pending'|'claimed'|'sold' };
type LiveWin = HistoryItem & { nickname?:string; rewardType?:string };
const qualityOrder:Quality[] = ['yellow','red','purple','blue','white'];
const qualityChance:Record<Quality,string> = { white:'55%',blue:'25%',purple:'12%',red:'6%',yellow:'2%' };

function session(){try{const value=JSON.parse(localStorage.getItem('prime-account-session')||'null');return value&&Number.isInteger(value.id)?value:null}catch{return null}}
function imageFor(prize:Prize|HistoryItem){return prize.imageUrl||'/assets/official-brand-original.webp'}

export default function Roulette(){
  const [player] = useState(session);
  const [prizes,setPrizes] = useState<Prize[]>([]);
  const [history,setHistory] = useState<HistoryItem[]>([]);
  const [wins,setWins] = useState<WinItem[]>([]);
  const [liveWins,setLiveWins] = useState<LiveWin[]>([]);
  const [freeSpins,setFreeSpins] = useState(0);
  const [balance,setBalance] = useState(0);
  const [spinPrice,setSpinPrice] = useState(89);
  const [spinCount,setSpinCount] = useState(1);
  const [quickMode,setQuickMode] = useState(false);
  const [selected,setSelected] = useState<Prize|null>(null);
  const [pendingRewards,setPendingRewards] = useState<WinItem[]>([]);
  const [settlingWinId,setSettlingWinId] = useState<number|null>(null);
  const [confirmCount,setConfirmCount] = useState<number|null>(null);
  const [confirmMode,setConfirmMode] = useState<'free'|'paid'>('paid');
  const [rolling,setRolling] = useState(false);
  const [error,setError] = useState('');
  const [loaded,setLoaded] = useState(false);

  async function load(){
    if(!player)return;
    setLoaded(false);
    let lastError: unknown = null;
    for(let attempt=0;attempt<2;attempt++){
      const controller=new AbortController();
      const timeout=window.setTimeout(()=>controller.abort(),20000);
      try{
        const response=await fetch(`/api/roulette?playerId=${player.id}`,{signal:controller.signal});
        const data=await response.json();
        if(!response.ok)throw new Error(data.error||'Рулетка недоступна');
        setPrizes(data.prizes||[]);setHistory(data.history||[]);setWins((data.wins||[]).map((item:WinItem)=>({...item,winId:item.id})));setFreeSpins(Number(data.freeSpins)||0);setBalance(Number(data.donate??data.balance)||0);setSpinPrice(Number(data.spinPrice)||89);setError('');setLoaded(true);return;
      }catch(value){
        lastError=value;
        if(attempt===0)await new Promise(resolve=>window.setTimeout(resolve,500));
      }finally{window.clearTimeout(timeout)}
    }
    setError(lastError instanceof DOMException&&lastError.name==='AbortError'?'Рулетка не відповіла вчасно. Спробуйте оновити сторінку.':lastError instanceof Error?lastError.message:'Рулетка недоступна');
    setLoaded(true);
  }
  useEffect(()=>{load()},[player?.id]);
  useEffect(()=>{
    if(!player)return;
    let stopped=false;
    const refresh=async()=>{try{const response=await fetch('/api/roulette?recent=1');const data=await response.json();if(response.ok&&!stopped)setLiveWins(data.recentWins||[])}catch{/* the next poll retries automatically */}};
    refresh();
    const timer=window.setInterval(refresh,10000);
    return()=>{stopped=true;window.clearInterval(timer)};
  },[player?.id]);
  useEffect(()=>{setSelected(pendingRewards[0]?.id ? pendingRewards[0] as unknown as Prize : null)},[pendingRewards]);
  const grouped=useMemo(()=>qualityOrder.map(quality=>({quality,items:prizes.filter(prize=>prize.quality===quality)})).filter(group=>group.items.length),[prizes]);
  function rouletteSound(){try{const AudioContextClass=window.AudioContext||((window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext);if(!AudioContextClass)return;const context=new AudioContextClass();const master=context.createGain();master.gain.value=.08;master.connect(context.destination);for(let index=0;index<7;index+=1){const oscillator=context.createOscillator();const gain=context.createGain();const start=context.currentTime+index*.22;oscillator.type=index%2?'triangle':'sine';oscillator.frequency.setValueAtTime(140+index*24,start);gain.gain.setValueAtTime(.001,start);gain.gain.exponentialRampToValueAtTime(.32,start+.025);gain.gain.exponentialRampToValueAtTime(.001,start+.16);oscillator.connect(gain).connect(master);oscillator.start(start);oscillator.stop(start+.18)}}catch{/* sound is optional and may be blocked by the browser */}}
  async function spin(count=spinCount,mode:'free'|'paid'='free'){if(!player||rolling)return;setRolling(true);setConfirmCount(null);setError('');rouletteSound();try{const response=await fetch('/api/roulette',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'spin',playerId:player.id,count,mode})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Не вдалося обертати рулетку');const results=(data.results||[{...data.prize,winId:data.winId,sellPrice:data.sellPrice}]).map((item:WinItem&{prize?:Prize})=>({...item.prize||item,winId:item.winId||item.id,sellPrice:item.sellPrice,status:'pending' as const,createdAt:new Date().toISOString()}));setFreeSpins(Number(data.freeSpins)||0);setBalance(Number(data.balance)||0);setTimeout(()=>{setPendingRewards(results);setWins(current=>[...results,...current].slice(0,30));setHistory(current=>[...results,...current].slice(0,30));setRolling(false)},quickMode?900:2400)}catch(value){setError(value instanceof Error?value.message:'Не вдалося обертати рулетку');setRolling(false)}}
  async function settle(win:WinItem, action:'claim'|'sell'){if(!player||!win.winId||settlingWinId)return;setSettlingWinId(win.winId);setError('');try{const response=await fetch('/api/roulette',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,playerId:player.id,winId:win.winId})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Не вдалося обробити виграш');setWins(current=>current.map(item=>item.winId===win.winId?{...item,status:action==='sell'?'sold':'claimed'}:item));setPendingRewards(current=>current.filter(item=>item.winId!==win.winId));if(action==='sell')setBalance(current=>current+Number(data.amount||0));else if(data.directGameCredit)load()}catch(value){setError(value instanceof Error?value.message:'Не вдалося обробити виграш')}finally{setSettlingWinId(null)}}
  const paidCount=spinCount*spinPrice;const freeAffordable=freeSpins>=spinCount;const paidAffordable=balance>=paidCount;
  const featuredPrizes=useMemo(()=>prizes.slice(0,8),[prizes]);
  if(!player)return <div className="roulette-guest"><Brand/><Gift size={42}/><h1>РУЛЕТКА ДОСТУПНА В КАБІНЕТІ</h1><p>Увійдіть до особистого кабінету, щоб отримувати призи та бачити історію виграшів.</p><a className="button gold" href="/account">УВІЙТИ ДО КАБІНЕТУ</a></div>;
return <div className="roulette-page"><header className="roulette-header"><a href="/account" className="roulette-back"><ArrowLeft size={16}/> КАБІНЕТ</a><Brand/><span className="roulette-player">{player.nickname}</span></header><main className="roulette-main"><div className="roulette-heading"><div><p className="eyebrow"><span/> PRIME REWARDS</p><h1>РУЛЕТКА</h1><p>Випробуйте удачу та отримуйте нагороди зі світу PRIME RP.</p></div><div className="roulette-wallet"><span>ВАШ БАЛАНС</span><strong><Coins size={20}/> {balance}</strong></div></div><section className="roulette-live"><div className="roulette-section-title"><h2><History size={20}/> ОСТАННІ ВИГРАШІ ОНЛАЙН</h2><span>Оновлюється автоматично</span></div><div className="roulette-live-track">{liveWins.length?liveWins.map(item=><article className={"roulette-live-card quality-"+item.quality} key={item.id}><img src={imageFor(item)} alt=""/><div><strong>{item.title}</strong><small>{item.nickname||"Гравець"}</small></div></article>):<span>Очікуємо нові виграші…</span>}</div></section><section className="roulette-featured"><div className="roulette-featured-track">{featuredPrizes.map(prize=><article className={"roulette-featured-card quality-"+prize.quality} key={prize.id}><img src={imageFor(prize)} alt=""/><strong>{prize.title}</strong><small>{prize.rewardType}</small></article>)}</div></section>{error&&<p className="roulette-error">{error}</p>}<section className="roulette-history roulette-history-top"><div className="roulette-section-title"><h2><History size={20}/> ОСТАННІ ВИГРАШІ</h2><span>Заберіть приз або продайте його</span></div><div className="roulette-history-row">{wins.length?wins.slice(0,8).map(item=><article className={`history-card quality-${item.quality}`} key={item.winId||item.id}><img src={imageFor(item)} alt=""/><strong>{item.title}</strong>{item.status==='pending'?<div className="history-actions"><button onClick={()=>settle(item,'claim')}>ЗАБРАТИ</button><button onClick={()=>settle(item,'sell')}>ПРОДАТИ · {item.sellPrice}</button></div>:<small>{item.status==='sold'?'ПРОДАНО':'ЗАБРАНО'}</small>}</article>):<p>Ви ще не вигравали призів.</p>}</div></section><section className="roulette-machine"><div className="roulette-pointer"/><div className={`roulette-track ${rolling?'rolling':''}`}>{(selected?[selected,...prizes]:prizes).slice(0,10).map((prize,index)=><article className={`roulette-result-card quality-${prize.quality}`} key={`${prize.id}-${index}`}><img src={imageFor(prize)} alt=""/><strong>{prize.title}</strong></article>)}</div><div className="roulette-center"><Sparkles size={27}/><span>{rolling?'ОБЕРТАЄМО…':selected?selected.title:'ОБЕРІТЬ НАГОРОДУ'}</span></div></section><div className="roulette-actions"><div className="roulette-free"><Gift size={18}/><span>Безкоштовних обертань<strong>{freeSpins}</strong></span></div><div className="roulette-counts" aria-label="Кількість прокруток">{[1,2,3,4,5].map(count=><button key={count} className={spinCount===count?"active":""} disabled={rolling} onClick={()=>setSpinCount(count)}>{count}</button>)}</div><div className="roulette-action-buttons"><button className="button outline roulette-spin" disabled={rolling||!freeAffordable} onClick={()=>spin(spinCount,"free")}>{rolling?<LoaderCircle className="spin-icon" size={18}/>:<Gift size={18}/>} КРУТИТИ БЕЗКОШТОВНО</button><button className="button gold roulette-spin" disabled={rolling||!paidAffordable} onClick={()=>{setConfirmMode("paid");setConfirmCount(spinCount)}}>{rolling?<LoaderCircle className="spin-icon" size={18}/>:<Coins size={18}/>} КРУТИТИ ЗА {paidCount}</button></div><label className="roulette-quick"><span>ШВИДКО</span><input type="checkbox" checked={quickMode} onChange={event=>setQuickMode(event.target.checked)}/></label><span className="roulette-hint"><ShieldCheck size={15}/> Повна стрічка призів · звук і плавна анімація</span></div><section className="roulette-prizes"><div className="roulette-section-title"><h2>ЙМОВІРНИЙ ДРОП</h2><span>Білий має найбільший шанс, жовтий — найменший</span></div>{loaded?grouped.map(group=><div className={`prize-quality quality-${group.quality}`} key={group.quality}><div className="quality-heading"><h3>{group.items[0].qualityLabel}</h3><b>{qualityChance[group.quality]}</b></div><div className="prize-grid">{group.items.map(prize=><article className="prize-card" key={prize.id}><img src={imageFor(prize)} alt=""/><strong>{prize.title}</strong><small>{prize.rewardType}</small></article>)}</div></div>):<p>Завантаження призів…</p>}</section></main>{confirmCount&&<div className="roulette-modal-backdrop"><div className="roulette-modal"><button className="roulette-modal-close" onClick={()=>setConfirmCount(null)}><X size={18}/></button><Sparkles size={34}/><h2>ПІДТВЕРДИТИ ПРОКРУТКУ</h2><p>Ви обрали <strong>{confirmCount} {confirmCount===1?'прокрутку':'прокрутки'}</strong>.</p><div className="roulette-modal-price"><Coins size={20}/> {confirmMode==='paid'?confirmCount*spinPrice+' донату':'безкоштовно'}{freeSpins>0&&<small>Безкоштовні обертання використаються першими.</small>}</div><div className="roulette-modal-actions"><button className="button outline" onClick={()=>setConfirmCount(null)}>СКАСУВАТИ</button><button className="button gold" onClick={()=>spin(confirmCount,confirmMode)}>ПІДТВЕРДИТИ</button></div></div></div>}{pendingRewards.length>0&&<div className="roulette-modal-backdrop"><div className={`roulette-modal roulette-reward quality-${pendingRewards[0].quality}`}><Sparkles size={34}/><span className="roulette-modal-kicker">ВИПАВ ПРИЗ</span><h2>{pendingRewards[0].title}</h2><img src={imageFor(pendingRewards[0])} alt=""/><p>Забрати приз у гру або продати його за <strong>{pendingRewards[0].sellPrice}</strong> донату.</p><div className="roulette-modal-actions"><button className="button outline" onClick={()=>settle(pendingRewards[0],'sell')}>ПРОДАТИ</button><button className="button gold" onClick={()=>settle(pendingRewards[0],'claim')}>ЗАБРАТИ ПРИЗ</button></div><small>Залишилось призів для обробки: {pendingRewards.length}</small></div></div>}</div>;
}
