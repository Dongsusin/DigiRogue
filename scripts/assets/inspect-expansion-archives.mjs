import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const root='C:/Users/pdwea/Develop/digirouge',dir=root+'/.tmp-convert/roster-expansion-2026-10-13',cache=root+'/.cache/digimon-expansion-2026-10-13/tmr';
const urls=JSON.parse(await fs.readFile(dir+'/nc-download-urls.json'));
const pending=JSON.parse(await fs.readFile(dir+'/pending-sources.json'));
const old=JSON.parse(await fs.readFile(root+'/docs/asset-sources/digimon-archive-urls.json'));
for(const x of pending)if(x.known?.archive&&old[x.known.archive])urls.push(old[x.known.archive]);
await fs.mkdir(cache,{recursive:true});let next=0;const rows=[];
await Promise.all(Array.from({length:3},async()=>{while(next<urls.length){const url=urls[next++],id=url.match(/\/(\d+)\.zip/)?.[1]??Object.entries(old).find(([,u])=>u===url)?.[0];if(!id)continue;
try{let data;try{data=await fs.readFile(cache+'/'+id+'.zip')}catch{const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('HTTP '+r.status);data=Buffer.from(await r.arrayBuffer());if(data.readUInt16LE(0)!==0x4b50)throw Error('not ZIP');await fs.writeFile(cache+'/'+id+'.zip',data);}
const p=spawnSync(process.execPath,['scripts/assets/inspect-fbx.mjs',cache+'/'+id+'.zip'],{cwd:root,encoding:'utf8',windowsHide:true,timeout:40000,maxBuffer:300000});const info=p.stdout.split('\n').flatMap(s=>{try{return[JSON.parse(s)]}catch{return[]}});rows.push({id,url,bytes:data.length,info,error:p.error?.message});console.log(JSON.stringify({id,files:info[0]?.files,models:info.slice(1).map(m=>({entry:m.entry,meshes:m.meshes,clips:m.animations?.map(a=>a.name),error:m.error}))}));
}catch(e){rows.push({id,url,error:String(e)});console.log(JSON.stringify({id,error:String(e)}));}
await fs.writeFile(dir+'/archive-inspection.json',JSON.stringify(rows,null,2));
}}));console.log(JSON.stringify({completed:true,archives:rows.length}));