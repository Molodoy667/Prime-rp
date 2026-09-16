import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {getStatusResponse} from './worker/status.mjs';
export default defineConfig({
 plugins:[react(),tailwindcss(),{name:'prime-server-status',configureServer(server){server.middlewares.use((req,res,next)=>{
  if(req.url?.split('?')[0]!=='/api/server-status')return next();
  if(!['GET','HEAD'].includes(req.method??'')){res.statusCode=405;res.setHeader('Allow','GET, HEAD');res.end();return}
  void getStatusResponse().then(async response=>{res.statusCode=response.status;response.headers.forEach((value,key)=>res.setHeader(key,value));res.end(req.method==='HEAD'?'':await response.text())}).catch(()=>{res.statusCode=503;res.end('Monitoring unavailable')});
 })}}],
 server:{host:'0.0.0.0',port:4173,allowedHosts:true},
 build:{outDir:'dist/client',rollupOptions:{output:{manualChunks:{motion:['framer-motion']}}}}
});
