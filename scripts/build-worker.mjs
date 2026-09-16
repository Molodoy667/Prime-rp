import {readFile,readdir,writeFile,mkdir,rm,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {build} from 'esbuild';
const assets={};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.woff':'font/woff','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())await walk(full);else{const bytes=await readFile(full);assets['/'+path.relative('dist/client',full)]={type:mime[path.extname(full)]||'application/octet-stream',body:bytes.toString('base64'),etag:'"'+createHash('sha256').update(bytes).digest('hex').slice(0,24)+'"'}}}}
await walk('dist/client');
await mkdir('.sites-runtime',{recursive:true});
await writeFile('.sites-runtime/assets.generated.mjs','export const assets='+JSON.stringify(assets)+';');
await mkdir('dist/server',{recursive:true});
await build({entryPoints:['worker/index.mjs'],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,outfile:'dist/server/index.js',plugins:[{name:'public-assets',setup(b){b.onResolve({filter:/assets\.generated\.mjs$/},()=>({path:path.resolve('.sites-runtime/assets.generated.mjs')}))}}]});
await mkdir('dist/.openai',{recursive:true});await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
// The Worker serves its embedded files; avoid uploading redundant copies.
await rm('dist/client',{recursive:true});
console.log('Worker with fixed server-status API and optimized SPA assets built.');
