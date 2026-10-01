import {parseMasterList} from './master-list.mjs';
export const MASTER_URL='http://master.mtasa.com/ase/mta/';
const MASTER_URL_BACKUP='https://master.multitheftauto.com/ase/mta/';
export const TARGET_IP='94.23.168.153',TARGET_PORT=22097;
const CACHE_MS=30000,MAX_SOURCE_AGE=5*60*1000;
let cached=null,pending=null;
function unknown(message,lastName){return {id:'prime-1',name:lastName||`${TARGET_IP}:${TARGET_PORT}`,subtitle:`${TARGET_IP}:${TARGET_PORT}`,status:'unknown',players:null,capacity:null,connectUrl:`mtasa://${TARGET_IP}:${TARGET_PORT}`,statusMessage:message}}
export async function loadStatus(fetcher=fetch,now=Date.now()){
 const checkedAt=new Date(now).toISOString();
 try{
  // The deployed Workers runtime supports manual/follow only. Reject redirects
  // through the status check below, keeping this request on the fixed MTA origin.
  const request=()=>fetcher(MASTER_URL,{headers:{Accept:'application/octet-stream','User-Agent':'PRIME-RP status monitor/1.0'}}).catch(()=>fetcher(MASTER_URL_BACKUP,{headers:{Accept:'application/octet-stream','User-Agent':'PRIME-RP status monitor/1.0'}}));
  const response=await Promise.race([
   request(),
   new Promise((_,reject)=>setTimeout(()=>reject(new Error('MTA_MASTER_TIMEOUT')),10000))
  ]);
  if(!response.ok)throw new Error(`MTA_UPSTREAM_HTTP_${response.status}`);
  if(Number(response.headers.get('content-length'))>4*1024*1024)throw new Error('Master response too large');
  const buffer=await response.arrayBuffer();if(buffer.byteLength>4*1024*1024)throw new Error('Master response too large');
  const record=parseMasterList(buffer,TARGET_IP,TARGET_PORT);
  const sourceTime=Date.parse(response.headers.get('last-modified')??'');
  const sourceUpdatedAt=Number.isFinite(sourceTime)?new Date(sourceTime).toISOString():undefined;
  let server;
  if(!record)server=unknown('Сервер не знайдено в актуальному переліку. Це не підтверджує, що він вимкнений.');
  else if(!Number.isFinite(sourceTime)||now-sourceTime>MAX_SOURCE_AGE||sourceTime>now+60000)server=unknown('Актуальність даних не підтверджена.',record.name);
  else server={id:'prime-1',name:record.name,subtitle:`${TARGET_IP}:${TARGET_PORT}`,status:record.notResponding===true?'offline':record.notResponding===false?'online':'unknown',players:record.notResponding===false?record.players:null,capacity:record.capacity,connectUrl:`mtasa://${TARGET_IP}:${TARGET_PORT}`,statusMessage:record.notResponding===true?'Сервер наразі не відповідає.':record.notResponding===false?'Статус сервера актуальний; можлива коротка затримка.':'Стан сервера не підтверджено.'};
  return {servers:[{...server,checkedAt,sourceUpdatedAt}],checkedAt,sourceUpdatedAt,source:MASTER_URL,refreshAfterSeconds:60};
 }catch(error){
  console.error('MTA monitoring unavailable', {name:error instanceof Error?error.name:'UnknownError',message:error instanceof Error?error.message:'Unknown upstream failure'});
  return {servers:[{...unknown('Не вдалося отримати актуальні дані. Спробуємо знову автоматично.'),checkedAt}],checkedAt,source:MASTER_URL,refreshAfterSeconds:60};
 }
}
export async function getStatusResponse(){
 const now=Date.now();
 if(!cached||now-cached.time>=CACHE_MS){
  if(!pending)pending=loadStatus().then(data=>{cached={time:Date.now(),data};return data}).finally(()=>{pending=null});
  await pending;
 }
 return Response.json(cached.data,{headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
