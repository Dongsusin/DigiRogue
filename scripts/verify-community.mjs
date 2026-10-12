import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanChatText, chatAlias, orderedMessages, onlinePlayers, buildChatUpdate, collectSnapshotChildren } from '../src/community/communityModel.js'
import { createCommunityController } from '../src/community/communityController.js'

// A small transport double replaces only the network. Controller subscriptions,
// validation, race handling, limits and displayed state all run as shipped.
function harness() {
 let connected, count, messages, clock = 10000, head = 0
 const calls = { count:0, messages:0, countStops:0, messageStops:0, writes:[], connects:0, disconnects:0 }
 const transport = {
  uid:'u1', connect(fn) { calls.connects++; connected=fn; return ()=>calls.disconnects++ },
  watchCount(fn) { calls.count++;count=fn;return ()=>calls.countStops++ },
  watchMessages(fn) { calls.messages++;messages=fn;return ()=>calls.messageStops++ },
  async readHead(){return head}, async readRate(){return null}, async write(update){calls.writes.push(update);head=update.head.seq},
 }
 const controller=createCommunityController({transport,now:()=>clock})
 return {controller,calls,transport,connect:value=>connected(value),count:value=>count(value),messages:value=>messages(value),advance:ms=>clock+=ms}
}
test('chat rejects blank or oversized messages and strips invisible controls',()=>{
 assert.equal(cleanChatText('  안녕\n테이머\u200b  '),'안녕 테이머')
 assert.throws(()=>cleanChatText(' \t '),/내용/)
 assert.throws(()=>cleanChatText('가'.repeat(201)),/200/)
 assert.equal(cleanChatText('<img src=x onerror=alert(1)>'),'<img src=x onerror=alert(1)>')
})
test('public aliases never expose a Google display name or an email',()=>{
 assert.match(chatAlias({uid:'abcdef1234',isAnonymous:false,displayName:'실명@example.com'}),/^테이머-/)
 assert.match(chatAlias({uid:'abcdef1234',isAnonymous:true}),/^게스트-/)
})
test('recent chat is ordered, limited and malformed rows cannot render',()=>{
 const rows=Array.from({length:45},(_,i)=>({seq:i+1,uid:'u',name:'이름',text:'메시지'+i,createdAt:(i+1)*31000}))
 const got=orderedMessages([...rows.reverse(),{seq:99,text:'bad'}])
 assert.equal(got.length,40);assert.equal(got[0].seq,6);assert.equal(got.at(-1).seq,45)
})
test('a player with multiple tabs is counted once and empty connections are ignored',()=>{
 assert.equal(onlinePlayers({a:{tab1:true,tab2:true},b:{tab3:true},c:null,d:{tab:false}}),2)
})
test('chat writes one ring slot with its monotonic head and same-user rate record atomically',()=>{
 const got=buildChatUpdate({seq:41,uid:'u1',name:'테이머',text:'안녕'})
 assert.deepEqual(Object.keys(got).sort(),['head','messages/1','rates/u1'])
 assert.equal(got.head.seq,41);assert.equal(got['messages/1'].seq,41)
 assert.equal(got['rates/u1'].seq,41);assert.deepEqual(got.head.createdAt,{'.sv':'timestamp'})
})
test('closed in-game chat creates no count or message subscriptions',()=>{
 const h=harness();h.controller.setView({visible:true,menu:false,open:false});h.connect(true)
 assert.equal(h.calls.count,0);assert.equal(h.calls.messages,0)
 h.controller.dispose();assert.equal(h.calls.disconnects,1)
})
test('main menu watches only count; opening chat watches messages; hiding stops all subscriptions',()=>{
 const h=harness();h.controller.setView({visible:true,menu:true,open:false});h.connect(true)
 assert.equal(h.calls.count,1);assert.equal(h.calls.messages,0)
 h.controller.setView({visible:true,menu:true,open:true});assert.equal(h.calls.messages,1)
 h.count(2);h.messages([{seq:1,uid:'u2',name:'상대',text:'안녕',createdAt:10}])
 assert.equal(h.controller.getSnapshot().count,2);assert.equal(h.controller.getSnapshot().messages[0].text,'안녕')
 h.controller.setView({visible:false,menu:true,open:true});assert.equal(h.calls.countStops,1);assert.equal(h.calls.messageStops,1);assert.equal(h.calls.disconnects,1)
 h.controller.dispose()
})
test('messages persist between menu and battle while count subscription stops',()=>{
 const h=harness();h.controller.setView({visible:true,menu:true,open:true});h.connect(true);h.messages([{seq:1,uid:'u2',name:'상대',text:'이전 대화',createdAt:10}])
 h.controller.setView({visible:true,menu:false,open:true})
 assert.equal(h.calls.countStops,1);assert.equal(h.calls.messages,1);assert.equal(h.controller.getSnapshot().messages[0].text,'이전 대화');h.controller.dispose()
})
test('successful sends are delivered once and a fourth-second cooldown rejects repeated sends',async()=>{
 const h=harness();h.controller.setView({visible:true,menu:true,open:true});h.connect(true)
 await h.controller.send('첫 대화','이름');assert.equal(h.calls.writes.length,1)
 await assert.rejects(h.controller.send('도배','이름'),/4초/);assert.equal(h.calls.writes.length,1)
 h.advance(4000);await h.controller.send('다음 대화','이름');assert.equal(h.calls.writes.length,2);h.controller.dispose()
})
test('offline sends never reach the network and connection loss does not show a fake player count',async()=>{
 const h=harness();h.controller.setView({visible:true,menu:true,open:true});h.connect(true);h.count(5);h.connect(false)
 assert.equal(h.controller.getSnapshot().count,null)
 await assert.rejects(h.controller.send('보내지 않기','이름'),/연결/);assert.equal(h.calls.writes.length,0);h.controller.dispose()
})
test('a concurrent writer advances the head, so one bounded retry uses the next ring slot',async()=>{
 const h=harness();let writes=0,reads=0;h.transport.readHead=async()=>reads++===0?5:6
 h.transport.write=async update=>{if(writes++===0)throw Object.assign(new Error('conflict'),{code:'PERMISSION_DENIED'});h.calls.writes.push(update)}
 h.controller.setView({visible:true,menu:true,open:true});h.connect(true);await h.controller.send('경합','이름')
 assert.equal(writes,2);assert.equal(h.calls.writes[0].head.seq,7);h.controller.dispose()
})
test('server rejection is visible, does not invent a message, and never retries forever',async()=>{
 const h=harness();let writes=0;h.transport.write=async()=>{writes++;throw Object.assign(new Error('denied'),{code:'PERMISSION_DENIED'})}
 h.controller.setView({visible:true,menu:true,open:true});h.connect(true)
 await assert.rejects(h.controller.send('실패','이름'));assert.equal(writes,1);assert.equal(h.controller.getSnapshot().pending,false);assert.equal(h.controller.getSnapshot().messages.length,0);h.controller.dispose()
})

test('initial Firebase snapshots visit all children instead of stopping after the first truthy Map.set result',()=>{
 const children=Array.from({length:40},(_,i)=>({key:String(i),val:()=>({seq:i+1})}))
 const snapshot={forEach(callback){for(const child of children)if(callback(child))break}}
 assert.equal(collectSnapshotChildren(snapshot).size,40)
})
test('already queued callbacks from a hidden tab cannot restore stale counts or messages',()=>{
 const h=harness();h.controller.setView({visible:true,menu:true,open:true});h.connect(true)
 h.controller.setView({visible:false,menu:true,open:true});h.count(99);h.messages([{seq:1,uid:'u',name:'이름',text:'늦은 수신',createdAt:1}])
 assert.equal(h.controller.getSnapshot().count,null);assert.equal(h.controller.getSnapshot().messages.length,0);h.controller.dispose()
})
test('double submission while a write is pending cannot send twice',async()=>{
 const h=harness();let finish;h.transport.write=()=>new Promise(resolve=>{finish=resolve})
 h.controller.setView({visible:true,menu:true,open:true});h.connect(true)
 const first=h.controller.send('첫 메시지','이름');while(!finish) await Promise.resolve();await assert.rejects(h.controller.send('중복','이름'),/보내고/)
 finish();await first;h.controller.dispose()
})
