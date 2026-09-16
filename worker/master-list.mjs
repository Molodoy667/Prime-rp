/** MTA master-list v2, based on the public protocol documented by the MTA client:
 * https://github.com/multitheftauto/mtasa-blue/blob/master/Client/core/ServerBrowser/CServerBrowser.RemoteMasterServer.cpp
 * Flag definitions: CServerList.h. No player identities are collected or returned.
 */
export function parseMasterList(buffer, targetIp, targetPort) {
 const bytes=new Uint8Array(buffer), view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(bytes.length<20||view.getUint16(0)!==0||view.getUint16(2)!==2||view.getUint32(bytes.length-4)!==0x12345679)throw new Error('Invalid MTA master-list format');
 const flags=view.getUint32(4),count=view.getUint32(12);
 if((flags&0x2c)!==0x2c||count>100000)throw new Error('Missing required MTA fields');
 let offset=16, found=null;
 for(let i=0;i<count;i++){
  if(offset+8>bytes.length-4)throw new Error('Truncated server record');
  const length=view.getUint16(offset),end=offset+length;
  if(length<8||end>bytes.length-4)throw new Error('Invalid server length');
  let at=offset+2;
  const ip=[bytes[at+3],bytes[at+2],bytes[at+1],bytes[at]].join('.');at+=4;
  const port=view.getUint16(at);at+=2;
  if(ip===targetIp&&port===targetPort){
   const need=n=>{if(at+n>end)throw new Error('Truncated target fields')};
   const u8=()=>{need(1);return view.getUint8(at++)};
   const u16=()=>{need(2);const n=view.getUint16(at);at+=2;return n};
   const str=()=>{const n=u8();need(n);const s=new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(at,at+n));at+=n;return s};
   const players=flags&0x4?u16():null,capacity=flags&0x8?u16():null;
   if(flags&0x10)str();const name=flags&0x20?str():'';
   if(flags&0x40)str();if(flags&0x80)str();if(flags&0x100)str();
   if(flags&0x200)u8();if(flags&0x400)u8();
   if(flags&0x800){const n=u16();for(let j=0;j<n;j++)str()}
   const notResponding=flags&0x1000?u8()!==0:null;
   if(!name.trim()||players===null||capacity===null||capacity<1||players>capacity)throw new Error('Invalid MTA server values');
   found={ip,port,name:name.replace(/#[a-fA-F0-9]{6}/g,'').replace(/[\u0000-\u001f\u007f]/g,'').trim(),players,capacity,notResponding};
  }
  offset=end;
 }
 if(offset!==bytes.length-4)throw new Error('Unexpected trailing data');
 return found;
}
