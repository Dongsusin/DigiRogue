import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { buildChatUpdate } from '../src/community/communityModel.js'
const enabled = process.env.FIREBASE_DATABASE_EMULATOR_HOST === '127.0.0.1:9000'
// Never run destructive security fixtures against a production database.
const base = 'http://127.0.0.1:9000', ns = 'demo-digirouge-default-rtdb'
async function request(path, token, method='GET', body) {
  const response = await fetch(base+'/'+path+'.json?ns='+ns+(token && token !== 'owner' ? '&auth='+encodeURIComponent(token) : ''), {
    method, headers:{'Content-Type':'application/json', ...(token === 'owner' ? {Authorization:'Bearer owner'} : {})}, body:body===undefined?undefined:JSON.stringify(body), signal:AbortSignal.timeout(5000) })
  return { status:response.status, value:await response.json() }
}
async function user() {
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({returnSecureToken:true}) })
  const body=await response.json()
  assert.equal(response.status,200);return {uid:body.localId,token:body.idToken}
}
test('Realtime Database enforces atomic chat, rate limits, bounded history and presence ownership', {skip:!enabled,timeout:45000}, async()=>{
  // Install exactly the checked-in rules in an isolated demo emulator.
  const rules=JSON.parse(await readFile(new URL('../database.rules.json',import.meta.url),'utf8'))
  assert.equal((await request('.settings/rules','owner','PUT',rules)).status,200)
  assert.equal((await request('','owner','PUT',null)).status,200)
  const [a,b]=await Promise.all([user(),user()])
  assert.equal((await request('community/messages',null)).status,401,'unauthenticated reads denied')
  const send=(who,seq,text='안녕하세요')=>request('community',who.token,'PATCH',buildChatUpdate({seq,uid:who.uid,name:'테이머',text}))
  assert.equal((await send(a,1)).status,200,'valid atomic send allowed')
  assert.equal((await send(a,2)).status,401,'server denies rapid repeated send')
  assert.equal((await request('community/rates/'+a.uid,a.token,'DELETE')).status,401,'cannot reset cooldown')
  assert.equal((await request('community/head',b.token,'PUT',{seq:2,uid:b.uid,createdAt:{'.sv':'timestamp'}})).status,401,'head-only forged update denied')
  const spoof=buildChatUpdate({seq:2,uid:a.uid,name:'위조',text:'위조'})
  assert.equal((await request('community',b.token,'PATCH',spoof)).status,401,'identity spoof denied')
  const oversized=buildChatUpdate({seq:2,uid:b.uid,name:'테이머',text:'정상'});oversized['messages/2'].text='가'.repeat(201)
  assert.equal((await request('community',b.token,'PATCH',oversized)).status,401,'server length limit enforced')
  const extra=buildChatUpdate({seq:2,uid:b.uid,name:'테이머',text:'정상'});extra['messages/2'].html='<script>'
  assert.equal((await request('community',b.token,'PATCH',extra)).status,401,'unexpected payload fields denied')
  assert.equal((await send(b,2)).status,200,'another player can send')
  assert.equal((await request('community/messages/1',b.token,'DELETE')).status,401,'message deletion denied')
  assert.equal((await request('presence/'+a.uid+'/abcdefghijklmnopqrst',a.token,'PUT',true)).status,200)
  assert.equal((await request('presence/'+a.uid+'/abcdefghijklmnopqrst',b.token,'DELETE')).status,401,'another player cannot remove presence')
  assert.equal((await request('presence/'+a.uid+'/abcdefghijklmnopqrst',a.token,'DELETE')).status,200)
  const players=await Promise.all(Array.from({length:40},()=>user()))
  for(let i=0;i<players.length;i++)assert.equal((await send(players[i],i+3)).status,200,'ring wrap send '+i)
  const history=(await request('community/messages',a.token)).value
  assert.equal(Object.keys(history).length,40,'history never exceeds 40')
  assert.equal(Math.min(...Object.values(history).map(row=>row.seq)),3)
  assert.equal(Math.max(...Object.values(history).map(row=>row.seq)),42)
  const [c,d]=await Promise.all([user(),user()])
  const race=await Promise.all([send(c,43),send(d,43)])
  assert.deepEqual(race.map(r=>r.status).sort(),[200,401],'only one concurrent head wins')
  const loser=race[0].status===401?c:d
  assert.equal((await send(loser,44)).status,200,'losing writer can retry next sequence')
})
