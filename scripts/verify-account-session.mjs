import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import { createSessionStorage } from '../src/auth/sessionStorage.js'
import { createAccountSession, SESSION_KEY, SESSION_MESSAGES, sessionServerDeadline } from '../src/auth/accountSession.js'
const storage = () => { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k,v) => map.set(k,v), removeItem: k => map.delete(k) } }
function backend() {
  const records = new Map(), listeners = new Map()
  const emit = uid => { for (const cb of [...(listeners.get(uid) ?? [])]) cb({ sessionId: records.get(uid) ?? null, confirmed: true }) }
  return { records, listeners,
    async claim(uid, previous, next, takeover) {
      if (!takeover && records.get(uid) !== previous) throw Object.assign(new Error('replaced'), { code: 'session/replaced' })
      records.set(uid,next); emit(uid)
    },
    async read(uid) { return records.get(uid) ?? null },
    watch(uid, callback, error) { const entries = listeners.get(uid) ?? new Set(); entries.add(callback); listeners.set(uid,entries); callback({sessionId: records.get(uid) ?? null, confirmed:true}); return () => entries.delete(callback) },
    async release(uid,id) { if(records.get(uid) === id) { records.delete(uid);emit(uid) } },
  }
}
let seq=0
const client = (store, raw=storage(), extra={}) => { const events=[];const session=createAccountSession({store,storage:raw,createId:()=> 'session-'+(++seq),onChange:state=>events.push(state),timeoutMs:20,...extra});return{session,raw,events} }
test('latest login replaces the previous device and clears only its session marker',async()=>{
 const db=backend(),a=client(db),b=client(db);a.raw.setItem('save','keep');await a.session.start('same',{takeover:true});await b.session.start('same',{takeover:true});assert.equal(a.session.state.phase,'ended');assert.equal(a.session.state.reason,'session/replaced');assert.equal(b.session.state.phase,'active');assert.equal(a.raw.getItem('save'),'keep');assert.equal(a.raw.getItem(SESSION_KEY),null)
})
test('different account IDs do not invalidate one another',async()=>{
 const db=backend(),a=client(db),b=client(db);await a.session.start('a',{takeover:true});await b.session.start('b',{takeover:true});assert.equal(a.session.state.phase,'active');assert.equal(b.session.state.phase,'active')
})
test('reload rotates the matching token and resumes without a new Google popup',async()=>{
 const db=backend(),a=client(db);await a.session.start('a',{takeover:true});const before=db.records.get('a');a.session.dispose();const reloaded=client(db,a.raw);await reloaded.session.start('a');assert.notEqual(db.records.get('a'),before);assert.equal(reloaded.session.state.phase,'active')
})
test('a replaced tab cannot reclaim ownership by reloading',async()=>{
 const db=backend(),a=client(db),b=client(db);await a.session.start('a',{takeover:true});const old=JSON.parse(a.raw.getItem(SESSION_KEY));await b.session.start('a',{takeover:true});a.raw.setItem(SESSION_KEY,JSON.stringify(old));const reloaded=client(db,a.raw);await assert.rejects(reloaded.session.start('a'),{code:'session/replaced'});assert.equal(b.session.state.phase,'active')
})
test('a persisted Firebase user without an ownership token must sign in again',async()=>{
 const db=backend(),a=client(db);await assert.rejects(a.session.start('a'),{code:'session/sign-in-required'});assert.equal(db.records.size,0)
})
test('duplicated tab storage rotates ownership and invalidates the earlier tab',async()=>{
 const db=backend(),a=client(db),raw=storage();await a.session.start('a',{takeover:true});raw.setItem(SESSION_KEY,a.raw.getItem(SESSION_KEY));const b=client(db,raw);await b.session.start('a');assert.equal(a.session.state.reason,'session/replaced');assert.equal(b.session.state.phase,'active')
})
test('logout from the replaced session cannot delete the current session',async()=>{
 const db=backend(),a=client(db),b=client(db);await a.session.start('a',{takeover:true});await b.session.start('a',{takeover:true});const id=db.records.get('a');await a.session.logout();assert.equal(db.records.get('a'),id);assert.equal(b.session.state.phase,'active')
})
test('normal logout removes only the owned session, preserving all progression',async()=>{
 const db=backend(),a=client(db);a.raw.setItem('account-save','keep');await a.session.start('a',{takeover:true});await a.session.logout();assert.equal(db.records.has('a'),false);assert.equal(a.raw.getItem(SESSION_KEY),null);assert.equal(a.raw.getItem('account-save'),'keep')
})
test('cached snapshots never grant ownership or falsely invalidate an active session',async()=>{
 const db=backend(),a=client(db);await a.session.start('a',{takeover:true});for(const cb of db.listeners.get('a')) cb({sessionId:'stale',confirmed:false});assert.notEqual(a.session.state.phase,'ended');await a.session.verify();assert.equal(a.session.state.phase,'active')
})
test('verification detects replacement missed while a tab was suspended',async()=>{
 const db=backend(),a=client(db);await a.session.start('a',{takeover:true});db.records.set('a','other-device');await a.session.verify();assert.equal(a.session.state.reason,'session/replaced');assert.equal(a.session.state.phase,'ended')
})
test('listener permission errors close game access with a readable message',async()=>{
 const db=backend();let fail;db.watch=(uid,cb,error)=>{fail=error;return()=>{}};const a=client(db);await a.session.start('a',{takeover:true});fail(new Error('permission denied'));assert.equal(a.session.state.reason,'session/unavailable');assert.match(SESSION_MESSAGES['session/unavailable'],/연결|확인/)
})
test('a server check timeout fails closed instead of allowing unverified play',async()=>{
 const db=backend(),a=client(db);await a.session.start('a',{takeover:true});db.read=()=>new Promise(()=>{});await a.session.verify();assert.equal(a.session.state.reason,'session/unavailable')
})
test('storage failure prevents claiming or overwriting the server session',async()=>{
 const db=backend(),raw=storage();raw.setItem=()=>{throw new Error('quota')};const a=client(db,raw);await assert.rejects(a.session.start('a',{takeover:true}),{code:'session/storage-unavailable'});assert.equal(db.records.size,0)
})
test('late async work after disposal cannot reactivate an unmounted provider',async()=>{
 const db=backend();let done;db.claim=()=>new Promise(r=>done=r);const a=client(db);const task=a.session.start('a',{takeover:true});a.session.dispose();done();await task;assert.notEqual(a.session.state.phase,'active');assert.equal(db.listeners.size,0)
})
test('concurrent claims leave only the last confirmed session active',async()=>{
 const db=backend(),a=client(db),b=client(db);await Promise.all([a.session.start('a',{takeover:true}),b.session.start('a',{takeover:true})]);assert.equal([a,b].filter(x=>x.session.state.phase==='active').length,1)
})
test('focus verification cannot reject a login that is still claiming ownership',async()=>{
 const db=backend();let finish;db.claim=(uid,prev,next)=>new Promise(resolve=>{finish=()=>{db.records.set(uid,next);resolve()}});const a=client(db);const login=a.session.start('a',{takeover:true});await a.session.verify();assert.notEqual(a.session.state.phase,'ended');finish();await login;assert.equal(a.session.state.phase,'active')
})
test('an expired or disposed claim receives cancellation and cannot overwrite a newer owner',async()=>{
 const db=backend();let finish;db.claim=(uid,prev,next,takeover,options)=>new Promise(resolve=>{finish=()=>{if(!options.signal.aborted&&Date.now()<options.deadline)db.records.set(uid,next);resolve()}});const a=client(db);await assert.rejects(a.session.start('a',{takeover:true}),{code:'session/unavailable'});db.records.set('a','newer-owner');finish();await Promise.resolve();assert.equal(db.records.get('a'),'newer-owner')
})
test('server deadline tolerates client clocks two minutes ahead and behind',()=>{
 const serverMs=1800000000000
 for(const skew of [-120000,0,120000]) { const clientStart=serverMs+skew;assert.equal(sessionServerDeadline(serverMs/1000,clientStart+12000,clientStart+1000),serverMs+11000) }
 assert.equal(sessionServerDeadline(serverMs/1000,serverMs-1,serverMs),serverMs)
})
test('delayed token response leaves the remaining login and logout budget usable',async()=>{
 let clock=1800000000000
 const serverStart=clock, writes=[]
 const source=(await fs.readFile(new URL('../src/auth/firebaseSessionStore.js',import.meta.url),'utf8')).replace(/^import[^\n]+\n/gm,'').replace('export const firebaseSessionStore =','globalThis.store =')
 const user={uid:'qa',async getIdTokenResult(){clock+=7000;return{claims:{auth_time:serverStart/1000,iat:serverStart/1000}}}}
 const context=vm.createContext({firebaseApp:{},firebaseAuth:{currentUser:user},sessionServerDeadline,
  Date:{now:()=>clock},getFirestore:()=>({}),doc:()=>({}),serverTimestamp:()=>({}),Timestamp:{fromMillis:value=>value},
  runTransaction:async(db,fn)=>fn({get:async()=>({data:()=>undefined}),set:(ref,value)=>writes.push(value)})})
 vm.runInContext(source,context)
 await context.store.claim('qa',null,'new',true,{signal:{aborted:false},deadline:serverStart+12000})
 assert.equal(writes[0].claimExpiresAt,serverStart+12000)
 assert.ok(writes[0].claimExpiresAt>clock)
 clock=serverStart
 context.runTransaction=async(db,fn)=>fn({get:async()=>({data:()=>({sessionId:'new',authTime:serverStart/1000})}),set:(ref,value)=>writes.push(value)})
 await context.store.release('qa','new')
 assert.equal(writes[1].claimExpiresAt,serverStart+12000)
 assert.ok(writes[1].claimExpiresAt>clock)
})

const locks = new WeakMap()
const rememberedClient = (db, persistent, tab=storage()) => {
 const adapter=createSessionStorage({persistent,tab})
 const runExclusive=task=>{const next=(locks.get(persistent)??Promise.resolve()).catch(()=>{}).then(task);locks.set(persistent,next);return next}
 return {...client(db,adapter,{runExclusive}),tab,adapter}
}
test('closing all tabs preserves ownership and a fresh browser tab resumes the same account',async()=>{
 const db=backend(),disk=storage(),a=rememberedClient(db,disk)
 await a.session.start('google',{takeover:true});const old=db.records.get('google');a.session.dispose()
 const rebooted=rememberedClient(db,disk);await rebooted.session.start('google')
 assert.equal(rebooted.session.state.phase,'active');assert.notEqual(db.records.get('google'),old)
 assert.equal(JSON.parse(disk.getItem(SESSION_KEY)).uid,'google')
})
test('a new tab may resume once but a replaced tab cannot borrow the remembered replacement token',async()=>{
 const db=backend(),disk=storage(),a=rememberedClient(db,disk),b=rememberedClient(db,disk)
 await a.session.start('google',{takeover:true});await b.session.start('google')
 assert.equal(a.session.state.reason,'session/replaced');assert.equal(b.session.state.phase,'active')
 assert.equal((JSON.parse(disk.getItem(SESSION_KEY)??'null')?.uid === 'google'),true)
 const oldReload=rememberedClient(db,disk,a.tab)
 await assert.rejects(oldReload.session.start('google'),{code:'session/sign-in-required'})
 assert.equal(b.session.state.phase,'active')
 await a.session.logout();assert.equal((JSON.parse(disk.getItem(SESSION_KEY)??'null')?.uid === 'google'),true)
})
test('logout erases the remembered login and a new tab cannot auto-login',async()=>{
 const db=backend(),disk=storage(),a=rememberedClient(db,disk)
 disk.setItem('progress','keep');await a.session.start('google',{takeover:true});await a.session.logout()
 assert.equal(disk.getItem(SESSION_KEY),null);assert.equal(disk.getItem('progress'),'keep')
 await assert.rejects(rememberedClient(db,disk).session.start('google'),{code:'session/sign-in-required'})
})
test('a different device login invalidates remembered ownership even after restart',async()=>{
 const db=backend(),disk=storage(),a=rememberedClient(db,disk),other=rememberedClient(db,storage())
 await a.session.start('google',{takeover:true});await other.session.start('google',{takeover:true})
 assert.equal(disk.getItem(SESSION_KEY),null)
 await assert.rejects(rememberedClient(db,disk).session.start('google'),{code:'session/sign-in-required'})
})
test('transient verification errors block play while retaining login for a later restart',async()=>{
 const db=backend(),disk=storage(),a=rememberedClient(db,disk)
 await a.session.start('google',{takeover:true});const read=db.read;db.read=async()=>{throw Error('offline')}
 await a.session.verify();assert.equal(a.session.state.phase,'ended');assert.equal((JSON.parse(disk.getItem(SESSION_KEY)??'null')?.uid === 'google'),true)
 db.read=read;await a.session.verify();assert.equal(a.session.state.phase,'active')
})
test('lost rotation responses recover both uncommitted and committed claims without a new login',async()=>{
 for(const committed of [false,true]) {
  const db=backend(),disk=storage(),a=rememberedClient(db,disk)
  await a.session.start('google',{takeover:true});a.session.dispose();const claim=db.claim
  db.claim=async(...args)=>{if(committed)await claim(...args);throw Error('response lost')}
  await assert.rejects(rememberedClient(db,disk).session.start('google'),{code:'session/unavailable'})
  db.claim=claim;const retry=rememberedClient(db,disk);await retry.session.start('google')
  assert.equal(retry.session.state.phase,'active')
 }
})
test('failed durable-storage writes never claim ownership and preserve the older login',async()=>{
 const db=backend(),disk=storage(),tab=storage(),a=rememberedClient(db,disk,tab)
 await a.session.start('google',{takeover:true});const before=disk.getItem(SESSION_KEY);a.session.dispose()
 const badTab=storage();badTab.setItem=()=>{throw Error('quota')}
 await assert.rejects(rememberedClient(db,disk,badTab).session.start('google'),{code:'session/storage-unavailable'})
 assert.equal(disk.getItem(SESSION_KEY),before);assert.equal(db.records.get('google'),JSON.parse(before).sessionId)
})
test('logout while reconciling a pending rotation cannot reactivate the login',async()=>{
 const db=backend(),disk=storage();disk.setItem(SESSION_KEY,JSON.stringify({uid:'google',sessionId:'pending',previousSessionId:'old',pending:true}))
 let finish;db.read=()=>new Promise(r=>finish=r);const a=rememberedClient(db,disk)
 const pending=a.session.start('google');for(let i=0;i<10;i++)await Promise.resolve();await a.session.logout();finish('old');await pending
 assert.equal(a.session.state.phase,'idle');assert.equal(db.records.size,0)
})

test('browser ownership rotations serialize all competing tabs before touching durable storage',async()=>{
 const db=backend(),disk=storage(),a=rememberedClient(db,disk)
 await a.session.start('google',{takeover:true});a.session.dispose()
 const b=rememberedClient(db,disk),c=rememberedClient(db,disk),d=rememberedClient(db,disk),claim=db.claim
 let finish,claims=0
 db.claim=async(...args)=>{claims++;await claim(...args);if(claims===1)await new Promise(r=>finish=r)}
 const tasks=[b.session.start('google'),c.session.start('google'),d.session.start('google')]
 for(let i=0;i<20;i++)await Promise.resolve()
 assert.equal(claims,1);finish();await Promise.all(tasks)
 assert.equal(claims,3);assert.equal([b,c,d].filter(x=>x.session.state.phase==='active').length,1)
 assert.equal(d.session.state.phase,'active');assert.equal(JSON.parse(disk.getItem(SESSION_KEY)).sessionId,d.session.state.sessionId)
 db.claim=claim;d.session.dispose();await rememberedClient(db,disk).session.start('google')
})
test('logging out a tab waiting for the browser lock cancels its queued restoration',async()=>{
 const db=backend(),disk=storage(),a=rememberedClient(db,disk)
 await a.session.start('google',{takeover:true});a.session.dispose()
 const b=rememberedClient(db,disk),c=rememberedClient(db,disk),claim=db.claim
 let finish;db.claim=async(...args)=>{await claim(...args);await new Promise(r=>finish=r)}
 const winner=b.session.start('google');for(let i=0;i<10;i++)await Promise.resolve()
 const waiting=c.session.start('google');await c.session.logout();finish();await winner;await waiting
 assert.equal(b.session.state.phase,'active');assert.equal(c.session.state.phase,'idle')
 assert.equal(JSON.parse(disk.getItem(SESSION_KEY)).sessionId,b.session.state.sessionId)
})
