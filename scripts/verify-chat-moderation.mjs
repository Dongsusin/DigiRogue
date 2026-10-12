import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanChatText, cleanChatName, orderedMessages, buildChatUpdate } from '../src/community/communityModel.js'
import { createCommunityController } from '../src/community/communityController.js'

const banned=['시발','씨발','씨 팔','시.발','시1발','ㅅ ㅂ','병신','병-신','개 새 끼','좆같네','지랄','FUCK','f.u.c.k','bitch','씨\u200b발','ｆｕｃｋ','씨발']
for(const text of banned)test('rejects profanity in messages and nicknames: '+JSON.stringify(text),()=>{
 assert.throws(()=>cleanChatText(text),/비속어/)
 assert.throws(()=>cleanChatName(text),/비속어/)
})
test('ordinary game words and brief reactions are preserved',()=>{
 for(const text of ['시발점이 어디야','시드몬','새끼 디지몬을 부화했어요','개체값','백신 타입','성숙기 진화','ㅋㅋㅋㅋ','아구몬 공격!','가루몬 파란 불꽃','hello champion','class selection'])assert.equal(cleanChatText(text),text)
})
test('rejects long repeated characters or repeated phrases',()=>{
 for(const text of ['ㅋ'.repeat(16),'가'.repeat(16),'도배'.repeat(12),'!'.repeat(20)])assert.throws(()=>cleanChatText(text),/반복|도배/)
})
test('existing history hides only offending messages and same-user rapid repeats',()=>{
 const make=(seq,uid,text,createdAt=seq*1000,name='테이머')=>({seq,uid,name,text,createdAt})
 const rows=[make(1,'a','안녕하세요',1000),make(2,'b','안녕하세요',2000),make(3,'a','안 녕 하 세 요!!',6000),make(4,'c','씨.발',7000),make(5,'c','일반 대화',8000,'병신'),make(6,'a','다음 맵으로',10000),make(7,'a','안녕하세요',62000)]
 assert.deepEqual(orderedMessages(rows).map(r=>r.seq),[1,2,6,7])
})
test('historical bursts retain the first five and normal subsequent conversation',()=>{
 const rows=Array.from({length:7},(_,i)=>({seq:i+1,uid:'a',name:'이름',text:'대화 '+i,createdAt:1000+i*4000}))
 rows.push({seq:8,uid:'a',name:'이름',text:'정상 대화 재개',createdAt:31000})
 assert.deepEqual(orderedMessages(rows).map(r=>r.seq),[1,2,3,4,5,8])
})
test('persisted rate blocks normalized duplicates after reopening chat',async()=>{
 const {assertChatRate}=await import('../src/community/chatModeration.js')
 const rate={createdAt:1000,recent:{0:{text:'안녕하세요',createdAt:1000}}}
 assert.throws(()=>assertChatRate('안 녕 하 세 요!!',rate,5000),/같은|반복/)
 assert.doesNotThrow(()=>assertChatRate('안녕하세요',rate,61000))
})
test('atomic update shifts only the bounded rate history and keeps server timestamps',()=>{
 const rate={createdAt:1000,recent:{0:{text:'hello',createdAt:1000}}}
 const update=buildChatUpdate({seq:2,uid:'u1',name:'테이머',text:'다음 대화',rate})
 assert.equal(Object.keys(update['rates/u1'].recent).length,10)
 assert.deepEqual(update['rates/u1'].recent[0],{text:'다음대화',createdAt:{'.sv':'timestamp'}})
 assert.deepEqual(update['rates/u1'].recent[1],rate.recent[0])
})
test('controller refuses profanity before network traffic and checks persisted spam state',async()=>{
 let reads=0,writes=0
 const transport={uid:'u1',connect(fn){fn(true);return()=>{}},watchCount(){return()=>{}},watchMessages(){return()=>{}},async readHead(){reads++;return 1},async readRate(){return {createdAt:1000,recent:{0:{text:'안녕하세요',createdAt:1000}}}},async write(){writes++}}
 const controller=createCommunityController({transport,now:()=>5000})
 controller.setView({visible:true,menu:false,open:true})
 await assert.rejects(controller.send('씨발','테이머'),/비속어/);assert.equal(reads,0)
 await assert.rejects(controller.send('안녕하세요!','테이머'),/같은|반복/);assert.equal(writes,0)
 assert.equal(controller.getSnapshot().pending,false);controller.dispose()
})

test('checked-in database rules match shared policy without changing unrelated paths',async()=>{
 const {readFile}=await import('node:fs/promises')
 const {applyChatRules}=await import('./lib/chat-rules.mjs')
 const rules=JSON.parse(await readFile(new URL('../database.rules.json',import.meta.url),'utf8'))
 const generated=applyChatRules(structuredClone(rules))
 assert.deepEqual(generated,rules)
 const fixture=structuredClone(rules)
 fixture.rules.hallOfFame={sentinel:'preserve'}
 fixture.rules.presence={sentinel:'preserve'}
 const result=applyChatRules(fixture)
 assert.deepEqual(result.rules.hallOfFame,{sentinel:'preserve'})
 assert.deepEqual(result.rules.presence,{sentinel:'preserve'})
})

test('normal Korean words ending in 시 do not turn 발견 or 발동 into profanity',()=>{
 for(const text of ['아구몬을 다시 발견했어요','스킬을 다시 발동했어요','공격 성공 시 발동합니다','도시 발전 이벤트','반드시 발견해야 합니다','잠시 발을 멈췄어요'])assert.equal(cleanChatText(text),text)
})
test('Unicode whitespace has the same duplicate key as normal spaces',async()=>{
 const {chatTextKey}=await import('../src/community/chatModeration.js')
 for(const text of ['안녕\u00a0하세요','안녕\u3000하세요','안녕\u202f하세요'])assert.equal(chatTextKey(text),chatTextKey('안녕하세요'))
})
test('a same-account conflict refreshes rate history as well as the sequence',async()=>{
 let headReads=0,rateReads=0,writes=0
 const rate={createdAt:4000,recent:{0:{text:'다른탭',createdAt:4000}}}
 const transport={uid:'u1',connect(fn){fn(true);return()=>{}},watchCount(){return()=>{}},watchMessages(){return()=>{}},async readHead(){return ++headReads===1?1:2},async readRate(){return ++rateReads===1?null:rate},async write(update){if(++writes===1)throw Object.assign(new Error('conflict'),{code:'PERMISSION_DENIED'});assert.deepEqual(update['rates/u1'].recent[1],rate.recent[0])}}
 const c=createCommunityController({transport,now:()=>9000});c.setView({visible:true,menu:false,open:true})
 await c.send('내 메시지','이름');assert.equal(writes,2);assert.equal(rateReads,2);c.dispose()
})

test('Korean conditional wording and polite questions are preserved without erasing curse prefixes',()=>{
 for(const text of ['혹시 빨리 진화시키는 방법 있나요?','스킬 사용 시 발동합니다','날씨 변화 시 발견','도시 발전 이벤트'])assert.equal(cleanChatText(text),text)
})
test('normal-word exemptions cannot erase unspaced profanity prefixes',()=>{
 for(const text of ['시발사기게임','시발놈','이거 시발게임이네','시 발 놈'])assert.throws(()=>cleanChatText(text),/비속어/)
})
