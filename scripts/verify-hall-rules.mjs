import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createClearRecord, createRunStats } from '../src/progression/hallOfFame.js'
const enabled=process.env.FIREBASE_DATABASE_EMULATOR_HOST==='127.0.0.1:9000'
const base='http://127.0.0.1:9000',ns='demo-digirouge-default-rtdb'
async function request(path,token,method='GET',body,query=''){
  const response=await fetch(base+'/'+path+'.json?ns='+ns+(token&&token!=='owner'?'&auth='+encodeURIComponent(token):'')+query,{
    method,headers:{'Content-Type':'application/json',...(token==='owner'?{Authorization:'Bearer owner'}:{})},
    body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(path === ".settings/rules" ? 60000 : 5000)})
  return {status:response.status,value:await response.json()}
}
async function user(google=true){
  const jwt=Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:crypto.randomUUID(),email:crypto.randomUUID()+'@example.invalid',email_verified:true,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.'
  const method=google?'signInWithIdp':'signUp'
  const response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:'+method+'?key=demo-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(google?{postBody:'id_token='+jwt+'&providerId=google.com',requestUri:'http://localhost',returnSecureToken:true}:{returnSecureToken:true})})
  const value=await response.json();assert.equal(response.status,200);return {uid:value.localId,token:value.idToken}
}
const payload=(turns,mode='classic')=>{const record=createClearRecord({gameMode:mode,currentStage:200,currentMap:'무한 마운틴',trainerRunId:'test-run-'+turns,
  runStats:{...createRunStats(1000),totalTurns:turns,finalClear:true},party:[{name:'아구몬',level:200,currentHp:10,maxHp:10,skills:[]}],enemies:[{currentHp:0}]},{now:5000});return {...record,team:JSON.parse(record.team),clearedAt:{'.sv':'timestamp'}}}
test('public hall rules enforce ownership, best-only writes, final stage, bounds and query limits',{skip:!enabled,timeout:90000},async()=>{
  const rules=JSON.parse(await readFile(new URL('../database.rules.json',import.meta.url),'utf8'))
  assert.equal((await request('.settings/rules','owner','PUT',rules)).status,200)
  assert.equal((await request('hallOfFame','owner','PUT',null)).status,200)
  const [a,b]=await Promise.all([user(),user()])
  const guest=await user(false)
  assert.equal((await request('hallOfFame/classic/entries/'+guest.uid,guest.token,'PUT',payload(300))).status,401)
  const path='hallOfFame/classic/entries/'+a.uid
  assert.equal((await request(path,a.token,'PUT',payload(400))).status,200)
  assert.equal((await request(path,b.token,'PUT',payload(300))).status,401)
  assert.equal((await request(path,a.token,'PUT',payload(500))).status,401)
  assert.equal((await request(path,a.token,'PUT',payload(400))).status,401)
  assert.equal((await request(path,a.token,'PUT',{...payload(300),stage:199})).status,401)
  assert.equal((await request(path,a.token,'PUT',{...payload(300),mode:'hard'})).status,401)
  assert.equal((await request(path,a.token,'PUT',{...payload(300),totalTurns:1.5})).status,401)
  assert.equal((await request(path,a.token,'PUT',{...payload(300),team:'not-json'})).status,401)
  for (const team of [[{...payload(300).team[0],items:'x'}],[{...payload(300).team[0],skills:'123456789'}],Array(9).fill(payload(300).team[0]),[{...payload(300).team[0],type:{bad:true}}],[{...payload(300).team[0],attack:'bad'}],[{...payload(300).team[0],skills:Array(9).fill('베이비 플레임')}],[{...payload(300).team[0],items:[{id:'crest',name:'용기',count:1000}]}]]) assert.equal((await request(path,a.token,'PUT',{...payload(300),team})).status,401)
  assert.equal((await request(path,a.token,'PUT',{...payload(300),email:'private@example.invalid'})).status,401)
  assert.equal((await request(path,a.token,'DELETE')).status,401)
  assert.equal((await request(path,a.token,'PUT',payload(350))).status,200)
  assert.equal((await request('hallOfFame/daily/entries/'+a.uid,a.token,'PUT',payload(300))).status,401)
  assert.equal((await request('hallOfFame/hard/entries/'+a.uid,a.token,'PUT',payload(600,'hard'))).status,200)
  assert.equal((await request('hallOfFame/classic/entries',null,'GET',undefined,'&orderBy=%22totalTurns%22&limitToFirst=10')).status,401)
  assert.equal((await request('hallOfFame/classic/entries',a.token)).status,401)
  assert.equal((await request('hallOfFame/classic/entries',a.token,'GET',undefined,'&orderBy=%22totalTurns%22&limitToFirst=11')).status,401)
  assert.equal((await request('hallOfFame/classic/entries',b.token,'GET',undefined,'&orderBy=%22totalTurns%22&limitToFirst=10')).status,200)
  assert.equal((await request(path,b.token)).status,401)
  assert.equal((await request(path,a.token)).status,200)
  const others=await Promise.all(Array.from({length:11},()=>user()))
  for(let i=0;i<others.length;i++)assert.equal((await request('hallOfFame/classic/entries/'+others[i].uid,others[i].token,'PUT',payload(500-i))).status,200)
  const top=(await request('hallOfFame/classic/entries',a.token,'GET',undefined,'&orderBy=%22totalTurns%22&limitToFirst=10')).value
  assert.equal(Object.keys(top).length,10)
  assert.deepEqual(Object.values(top).map(x=>x.totalTurns).sort((a,b)=>a-b),[350,490,491,492,493,494,495,496,497,498])
})
