import {getStatusResponse} from './status.mjs';
import {assets} from './assets.generated.mjs';
export default {
 async fetch(request){
  const url=new URL(request.url);
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  if(url.pathname==='/api/server-status'){
   const r=await getStatusResponse();return request.method==='HEAD'?new Response(null,{headers:r.headers,status:r.status}):r;
  }
  // Embedded immutable public assets keep the existing SPA independent of runtime bindings.
  // Source paths and user-controlled upstream URLs are never served or fetched.
  const path=url.pathname==='/'?'/index.html':url.pathname;
  const asset=assets[path]??(path.startsWith('/api/')?null:assets['/index.html']);
  if(!asset)return new Response('Not found',{status:404});
  const headers={'Content-Type':asset.type,'X-Content-Type-Options':'nosniff','Cache-Control':asset.type.startsWith('text/html')?'private, no-store, max-age=0':'public, max-age=3600','ETag':asset.etag};
  if(request.headers.get('if-none-match')===asset.etag)return new Response(null,{status:304,headers});
  return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0)),{headers});
 }
};
