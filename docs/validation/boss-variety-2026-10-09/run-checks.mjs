import fs from 'node:fs/promises';import cp from 'node:child_process';
const root='C:/Users/pdwea/Develop/digirouge',out=root+'/docs/validation/boss-variety-2026-10-09',commands=[];
const node='C:/Program Files/nodejs/node.exe';
const run=(name,args)=>new Promise((resolve,reject)=>{const p=cp.spawn(node,args,{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});let stdout='',stderr='';p.stdout.on('data',b=>stdout+=b);p.stderr.on('data',b=>stderr+=b);p.on('error',reject);p.on('close',exitCode=>{commands.push({name,exe:node,args,exitCode,stdout,stderr});console.log('CHECK '+name+' exit='+exitCode);exitCode===0?resolve():reject(Error(name+' '+stdout+' '+stderr))})});
try{
for(const file of ['src/data/regionalBossProfiles.js','src/battle/encounterVariety.js','src/data/bossProfiles.js','src/data/rivalProfiles.js','src/battle/bossEncounters.js','src/battle/rivalEncounters.js','scripts/verify-boss-variety.mjs'])await run('syntax '+file,['--check',file]);
await run('escape + regional-support + balance regression',['--test','scripts/verify-escape.mjs','scripts/verify-regional-support.mjs','scripts/verify-adventure-balance.mjs']);
await run('runtime assets',['scripts/verify-runtime.mjs']);
await run('production build',['node_modules/vite/bin/vite.js','build']);
await run('distribution assets',['scripts/verify-runtime.mjs','--dist']);
await fs.writeFile(out+'/game-checks.json',JSON.stringify({passed:true,exitCode:0,commands},null,2));
console.log(JSON.stringify({passed:true,exitCode:0,commands:commands.length}));
}catch(e){await fs.writeFile(out+'/game-checks.json',JSON.stringify({passed:false,error:e.stack,commands},null,2));throw e}
