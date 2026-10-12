import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { buildChatUpdate } from '../src/community/communityModel.js'
const enabled = process.env.FIREBASE_DATABASE_EMULATOR_HOST === '127.0.0.1:9000'
// Never run destructive security fixtures against a production database.
const base = 'http://127.0.0.1:9000', ns = 'demo-digirouge-default-rtdb'
async function request(path, token, method='GET', body) {
  const response = await fetch(base+'/'+path+'.json?ns='+ns+(token && token !== 'owner' ? '&auth='+encodeURIComponent(token) : ''), {
    method, headers:{'Content-Type':'application/json', ...(token === 'owner' ? {Authorization:'Bearer owner'} : {})}, body:body===undefined?undefined:JSON.stringify(body), signal:AbortSignal.timeout(path === ".settings/rules" ? 60000 : 5000) })
  return { status:response.status, value:await response.json() }
}
async function user() {
  const response = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key',{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({returnSecureToken:true}) })
  const body=await response.json()
  assert.equal(response.status,200);return {uid:body.localId,token:body.idToken}
}
test('Realtime Database enforces atomic chat, rate limits, bounded history and presence ownership', {skip:!enabled,timeout:90000}, async()=>{
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


test('server independently denies profanity, repeat spam, burst resets and forged rate history', {skip:!enabled,timeout:90000}, async()=>{
 const rules=JSON.parse(await readFile(new URL('../database.rules.json',import.meta.url),'utf8'))
 assert.equal((await request('.settings/rules','owner','PUT',rules)).status,200)
 assert.equal((await request('','owner','PUT',null)).status,200)
 const a=await user(), b=await user()
 const {chatTextKey,CHAT_IGNORED_CHARACTERS}=await import('../src/community/chatModeration.js')
 const payload=async(who,text,name='테이머')=>{
  const seq=((await request('community/head/seq',who.token)).value??0)+1
  const rate=(await request('community/rates/'+who.uid,who.token)).value
  const update=buildChatUpdate({seq,uid:who.uid,name:'테이머',text:'정상 대화',rate})
  update['messages/'+seq%40].text=text;update['messages/'+seq%40].name=name
  update['rates/'+who.uid].recent[0].text=CHAT_IGNORED_CHARACTERS.reduce((out,char)=>out.split(char).join(''),text.toLowerCase())
  return update
 }
 const attempt=async(who,text,name)=>request('community',who.token,'PATCH',await payload(who,text,name))
 for(const text of ['시발사기게임','이거 시발게임이네','시 발 놈','이거 씨발 게임이네','닉네임 병신입니다','100스테이지 ㅅㅂ;','씨발','시.발','시1발','ㅅ ㅂ','병-신','개 새 끼','F.U.C.K','씨\u200b발','ｆｕｃｋ','씨발','ㅋ'.repeat(16),'도배'.repeat(12),'진'.repeat(12),'승리'.repeat(6),'안녕\u00a0하세요','안녕\u3000하세요']){
  const result=await attempt(a,text)
  assert.equal(result.status,401,'REST bypass rejected: '+JSON.stringify(text))
 }
 assert.equal((await attempt(a,'정상 대화','씨발')).status,401,'profane nickname denied')
 for(const text of ['혹시 빨리 진화시키는 방법 있나요?','스킬 사용 시 발동합니다','날씨 변화 시 발견','도시 발전 이벤트','시발점']) assert.equal((await attempt(await user(),text)).status,200,'normal context allowed: '+text)
 assert.equal((await attempt(a,'아구몬을 다시 발견했어요','게스트-hxdy47')).status,200,'normal Korean sentence and default guest alias allowed')
 assert.equal((await attempt(b,'hello champion class selection')).status,200,'normal English words allowed')
 assert.equal((await request('community/rates/'+a.uid,b.token)).status,401,'another user cannot read rate history')
 const seed=async(who,entries)=>{
  const now=Date.now(),recent={}
  for(let i=0;i<10;i++)recent[i]=entries[i]?{text:chatTextKey(entries[i]),createdAt:now-5000-i*4000}:{text:'',createdAt:0}
  await request('community/rates/'+who.uid,'owner','PUT',{seq:1,createdAt:now-5000,recent})
  return recent
 }
 await seed(a,['안녕하세요','이전 대화'])
 assert.equal((await attempt(a,'안 녕 하 세 요!!')).status,401,'whitespace and punctuation cannot bypass repeated-message check')
 assert.equal((await attempt(a,'이전 대화')).status,401,'alternating messages cannot bypass the history check')
 const forged=await payload(a,'안녕하세요');forged['rates/'+a.uid].recent[0].text='위조'
 assert.equal((await request('community',a.token,'PATCH',forged)).status,401,'client cannot forge canonical text')
 const reset=await payload(a,'새로운 대화');reset['rates/'+a.uid].recent[1]={text:'',createdAt:0}
 assert.equal((await request('community',a.token,'PATCH',reset)).status,401,'client cannot erase previous messages from rate history')
 await seed(b,[])
 assert.equal((await attempt(b,'안녕하세요')).status,200,'greeting from another user allowed')
 await seed(a,['하나','둘','셋','넷','다섯'])
 assert.equal((await attempt(a,'여섯')).status,401,'sixth message in thirty seconds denied')
 await seed(a,[])
 const aged=(await request('community/rates/'+a.uid,a.token)).value
 aged.recent[0]={text:'안녕하세요',createdAt:Date.now()-61000}
 await request('community/rates/'+a.uid,'owner','PUT',aged)
 assert.equal((await attempt(a,'안녕하세요')).status,200,'same text allowed again after a minute')
 const validRate=(await request('community/rates/'+a.uid,a.token)).value
 assert.equal(Object.keys(validRate.recent).length,10,'rate memory stays bounded')
 assert.equal(validRate.recent[1].text,'안녕하세요','history shifted exactly, not reset')
 assert.equal((await request('community/rates/'+a.uid,a.token,'DELETE')).status,401,'reload cannot reset server rate state')
})
