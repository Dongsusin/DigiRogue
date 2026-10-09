import fs from 'node:fs/promises';import cp from 'node:child_process';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const root='C:/Users/pdwea/Develop/digirouge',out=root+'/docs/validation/boss-variety-2026-10-09';
const work='C:/Users/pdwea/Develop/media/digilog-trailer-2026-10-09/work/gameplay-v8';
const require=createRequire('C:/Users/pdwea/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json'),{chromium}=require('playwright');
const seed=Object.fromEntries(JSON.parse(await fs.readFile('C:/Users/pdwea/Develop/media/digilog-trailer-2026-10-08/work/browser-state.json','utf8')).origins[0].localStorage.filter(x=>!x.name.includes('save')).map(x=>[x.name,x.value]));
seed['digirogue-local-guest-v1']=JSON.stringify({uid:'local-guest-boss-qa',displayName:'게스트',isLocalGuest:true});
seed['digirogue-settings-v1']=JSON.stringify({gameSpeed:1,expBarSpeed:1,evolutionSpeed:1,masterVolume:0,bgmVolume:0,sfxVolume:0,enabledBgmUrls:[]});
const base=JSON.parse(await fs.readFile('C:/Users/pdwea/Develop/media/digilog-trailer-2026-10-08/work/base-save.json','utf8')).gameState;
const cases=[
 ['water-sea','용의눈호수',100,'regional-sea-serpent-wild','메탈시드라몬'],
 ['water-moon','용의눈호수',100,'regional-moon-watch-wild','디아나몬'],
 ['water-lake','용의눈호수',100,'regional-marsh-chorus-wild','플레시오몬'],
 ['waste-crown','쓰레기의 산',100,'regional-scrap-monkey-wild','메탈에테몬'],
 ['waste-chief','쓰레기의 산',100,'regional-goblin-chief-wild','타이타몬'],
 ['waste-watch','쓰레기의 산',100,'regional-factory-watch-wild','하이안드로몬'],
 ['network-infection','다크 웹',150,'regional-net-infection-wild','디아블로몬'],
 ['network-devourer','다크 웹',150,'regional-data-devourer-wild','알카디몬'],
 ['network-hunter','다크 웹',150,'regional-cyber-hunter-wild','저스티몬'],
 ['holy-saint','가디언 팰리스',130,'regional-sword-saint','제스몬'],
 ['holy-beast','가디언 팰리스',130,'regional-holy-beast','슬레이프몬'],
 ['holy-dragon','가디언 팰리스',130,'regional-dragon-samurai','오류우몬'],
];
const server=cp.spawn('C:/Program Files/nodejs/node.exe',[work+'/game-server.mjs'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
let serverLog='',browser;const errors=[],responses=[],shots=[];
try{
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('capture server timeout '+serverLog)),20000);server.on('error',reject);server.stdout.on('data',b=>{serverLog+=b;if(serverLog.includes('"ready":true')){clearTimeout(timeout);resolve()}});server.stderr.on('data',b=>serverLog+=b);server.on('close',code=>reject(Error('server exit '+code+' '+serverLog)))});
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=d3d11','--enable-gpu','--ignore-gpu-blocklist','--mute-audio']});
 const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,reducedMotion:'reduce'});
 await context.addInitScript(values=>{let storage={...values};window.auroraGame={version:1,gameId:'digilog',readStorage:()=>({...storage}),initializeStorage:v=>(storage={...v}),setItem:(k,v)=>{storage={...storage,[k]:String(v)}},removeItem:k=>{delete storage[k]}}},seed);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400 && r.url().startsWith('http://127.0.0.1:5183'))responses.push({status:r.status(),url:r.url()})});
 await page.goto('http://127.0.0.1:5183/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__gameCapture,{timeout:60000});
 for(const [id,map,stage,bossId,expected] of cases){
  await page.evaluate(()=>window.__gameCapture.menu());
  await page.evaluate(({s,base})=>window.__gameCapture.prepare(s,base),{s:{view:'boss',map,stage,bossId,allies:['워그레이몬'],enemies:[expected],level:120},base});
  await page.waitForFunction(()=>[...document.querySelectorAll('[data-combatant-id]')].length>=2 && [...document.querySelectorAll('[data-combatant-id]')].every(n=>n.dataset.modelReady==='true'),{},{timeout:30000});
  await page.waitForTimeout(500);
  const state=await page.evaluate(()=>{const s=window.__gameCapture.state().gameState;return{map:s.currentMap,stage:s.currentStage,enemies:s.enemies.map(u=>({id:u.id,name:u.name,hp:u.currentHp,maxHp:u.maxHp,segments:u.bossHpSegmentCount,profile:u.bossEncounter.id})),canvas:[...document.querySelectorAll('.adventure-field canvas')].map(n=>({width:n.width,height:n.height})),body:document.body.innerText}});
  assert.equal(state.enemies[0].name,expected,id);assert.equal(state.enemies[0].profile,bossId,id);assert(state.enemies[0].hp>0);assert.equal(state.enemies[0].segments,4);assert(state.canvas.some(n=>n.width>0&&n.height>0));assert(state.body.includes(expected));
  const file=out+'/'+id+'.png';await page.screenshot({path:file});shots.push({id,expected,file,...state,body:undefined});console.log('VISIBLE '+id+' '+expected);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(responses,[]);
 await fs.writeFile(out+'/browser-checks.json',JSON.stringify({passed:true,exitCode:0,shots,errors,responses,isolatedMemoryStorage:true,serverLog},null,2));
 console.log(JSON.stringify({passed:true,exitCode:0,scenes:shots.length,modelsReady:24}));
}catch(e){await fs.writeFile(out+'/browser-error.json',JSON.stringify({passed:false,error:e.stack,shots,errors,responses,serverLog},null,2));throw e}
finally{if(browser)await browser.close();server.kill()}
