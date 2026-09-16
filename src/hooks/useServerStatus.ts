import {useCallback,useEffect,useRef,useState} from 'react';
import {getServers} from '../data/api';
import {siteConfig} from '../config/site';
import type {Server} from '../types';
export function useServerStatus(){
 const [servers,setServers]=useState<Server[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const trigger=useRef<()=>void>(()=>{});
 const refresh=useCallback(()=>trigger.current(),[]);
 useEffect(()=>{
  let stopped=false,timer:ReturnType<typeof setTimeout>|undefined,controller:AbortController|undefined;
  const poll=async()=>{
   if(stopped||document.hidden)return;
   if(timer)clearTimeout(timer);controller?.abort();const current=new AbortController();controller=current;
   const timeout=setTimeout(()=>current.abort(),15000);setLoading(true);
   try{const next=await getServers(current.signal);if(!stopped&&current===controller){setServers(next);setError('')}}
   catch{if(!stopped&&current===controller){setServers([]);setError('Моніторинг тимчасово недоступний. Автоматично повторимо перевірку.')}}
   finally{clearTimeout(timeout);if(!stopped&&current===controller){setLoading(false);timer=setTimeout(poll,siteConfig.serverRefreshMs)}}
  };
  trigger.current=()=>{void poll()};
  const onVisibility=()=>{if(document.hidden){if(timer)clearTimeout(timer)}else void poll()};
  void poll();document.addEventListener('visibilitychange',onVisibility);
  return()=>{stopped=true;controller?.abort();if(timer)clearTimeout(timer);trigger.current=()=>{};document.removeEventListener('visibilitychange',onVisibility)};
 },[]);
 return {servers,error,loading,refresh};
}
