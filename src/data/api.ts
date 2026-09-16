import {siteConfig} from '../config/site';
import {mockNews} from './content';
import type {Server,NewsItem} from '../types';
async function request<T>(url:string,signal?:AbortSignal):Promise<T>{
 if(!url)throw new Error('API не підключено');
 const r=await fetch(url,{signal,cache:'no-store'});
 if(!r.ok)throw new Error('Не вдалося отримати дані');
 return r.json();
}
export async function getServers(signal?:AbortSignal):Promise<Server[]>{
 const data=await request<{servers:Server[]}>(siteConfig.serverApiUrl,signal);
 if(!data||!Array.isArray(data.servers)||data.servers.length!==1)throw new Error('Некоректна відповідь моніторингу');
 const server=data.servers[0];
 if(server.id!=='prime-1'||typeof server.name!=='string'||!server.name.trim()||server.name.length>300||!['online','offline','unknown'].includes(server.status)||server.subtitle!==siteConfig.serverAddress||server.connectUrl!==`mtasa://${siteConfig.serverAddress}`)throw new Error('Некоректні дані сервера');
 if(server.players!==null&&(!Number.isInteger(server.players)||server.players<0))throw new Error('Некоректний онлайн');
 if(server.capacity!==null&&(!Number.isInteger(server.capacity)||server.capacity<1))throw new Error('Некоректний ліміт');
 if(server.status==='online'&&(server.players===null||server.capacity===null||server.players>server.capacity))throw new Error('Неповні дані онлайну');
 return [server,{id:'prime-2',name:'PRIME RP #2',subtitle:'Наступна глава',status:'soon',players:null,capacity:null,connectUrl:'#'}];
}
export const getNews=(signal?:AbortSignal):Promise<NewsItem[]>=>siteConfig.useMockNews?Promise.resolve(mockNews):request(siteConfig.newsApiUrl,signal);
