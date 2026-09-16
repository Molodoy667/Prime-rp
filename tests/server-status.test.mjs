import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseMasterList} from '../worker/master-list.mjs';
import {loadStatus,TARGET_IP,TARGET_PORT} from '../worker/status.mjs';
// One public server record captured from official master list, 2026-09-16.
// Excludes all other servers and all player identities.
const fixture=readFileSync(new URL('./fixtures/master-one-server.bin',import.meta.url));
const ab=b=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
const now=Date.parse('2026-09-16T03:00:00Z');
const fetchFixture=(bytes=fixture,date=new Date(now).toUTCString())=>async()=>new Response(bytes,{headers:{'last-modified':date}});
test('exact IP and port match, preserves advertised name, treats nonresponse separately',()=>{
 assert.deepEqual(parseMasterList(ab(fixture),TARGET_IP,TARGET_PORT),{ip:TARGET_IP,port:TARGET_PORT,name:'SILVER [ #01 ]',players:0,capacity:90,notResponding:true});
 assert.equal(parseMasterList(ab(fixture),TARGET_IP,22098),null);
});
test('rejects truncated and malformed lists instead of displaying plausible numbers',()=>{
 assert.throws(()=>parseMasterList(ab(fixture.subarray(0,-1)),TARGET_IP,TARGET_PORT));
 const broken=Buffer.from(fixture);broken.writeUInt16BE(65535,16);assert.throws(()=>parseMasterList(ab(broken),TARGET_IP,TARGET_PORT));
});
test('offline source never masquerades as an online server with zero players',async()=>{
 const data=await loadStatus(fetchFixture(),now);assert.equal(data.servers[0].status,'offline');assert.equal(data.servers[0].players,null);assert.equal(data.servers[0].capacity,90);
});
test('uses an edge-compatible redirect policy and refuses redirected upstreams',async()=>{
 let calls=0;
 const data=await loadStatus(async(url,options)=>{
  calls++;assert.equal(options.redirect,'manual');
  return new Response(null,{status:302,headers:{Location:'https://example.com/other'}});
 },now);
 assert.equal(calls,1);assert.equal(data.servers[0].status,'unknown');assert.equal(data.servers[0].players,null);
});
test('zero is a valid real online value when source says responding',async()=>{
 const online=Buffer.from(fixture);online[online.indexOf('1.5n')+5]=0;
 const data=await loadStatus(fetchFixture(online),now);assert.equal(data.servers[0].status,'online');assert.equal(data.servers[0].players,0);assert.equal(data.servers[0].name,'SILVER [ #01 ]');
});
test('upstream failure, stale data and missing timestamps produce unknown, not fabricated values',async()=>{
 for(const f of [async()=>{throw new Error('network')},async()=>new Response('bad',{status:503}),fetchFixture(fixture,'Wed, 16 Sep 2026 02:00:00 GMT'),async()=>new Response(fixture)]){
  const data=await loadStatus(f,now);assert.equal(data.servers[0].status,'unknown');assert.equal(data.servers[0].players,null);
 }
});
