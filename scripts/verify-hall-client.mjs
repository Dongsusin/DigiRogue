import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { createHallClient } from '../src/hall/hallClient.js'
import { createClearRecord, createRunStats } from '../src/progression/hallOfFame.js'
const record = turns => createClearRecord({ gameMode:'classic',currentStage:200,currentMap:'무한 마운틴',trainerRunId:'run-' + turns,
  runStats:{...createRunStats(1000),totalTurns:turns,finalClear:true},party:[{name:'아구몬',level:200,currentHp:10,maxHp:10,skills:[]}],enemies:[{currentHp:0}]},{now:5000})

test('bounded reads, atomic personal best and racing uploads work over real HTTP', async () => {
  const data=new Map(), calls=[]
  let revision=0
  const server=http.createServer(async(req,res)=>{
    const url=new URL(req.url,'http://localhost');calls.push({method:req.method,path:url.pathname,query:url.searchParams})
    if(url.searchParams.get('auth')!=='test-token'){res.writeHead(401);res.end('{}');return}
    if(url.searchParams.has('orderBy') && req.headers['x-firebase-etag']){res.writeHead(400);res.end('{}');return}
    if(req.method==='GET') {
      res.setHeader('etag','"' + revision + '"')
      const value=url.pathname.endsWith('/entries.json')?Object.fromEntries(data):data.get(url.pathname.split('/').at(-1).replace('.json',''))??null
      res.end(JSON.stringify(value));return
    }
    if(req.headers['if-match']!=='"' + revision + '"'){res.writeHead(412);res.end('{}');return}
    let body='';for await(const part of req)body+=part
    const value=JSON.parse(body);assert.deepEqual(value.clearedAt,{'.sv':'timestamp'});assert(Array.isArray(value.team))
    data.set(url.pathname.split('/').at(-1).replace('.json',''),{...value,clearedAt:6000});revision++
    res.end(JSON.stringify(value))
  })
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  try {
    const client=createHallClient({baseUrl:'http://127.0.0.1:'+server.address().port,getToken:async()=>'test-token'})
    await Promise.all([client.submit('player-a',record(600)),client.submit('player-a',record(400))])
    assert.equal(data.get('player-a').totalTurns,400)
    assert.deepEqual(await client.submit('player-a',record(500)),{improved:false})
    await client.submit('player-b',record(300))
    const ranked=await client.list('classic')
    assert.deepEqual(ranked.map(x=>x.totalTurns),[300,400])
    const query=calls.at(-1).query
    assert.equal(query.get('orderBy'),'"totalTurns"');assert.equal(query.get('limitToFirst'),'10')
    assert.equal(data.size,2)
    assert(!JSON.stringify([...data.values()]).includes('playerKey'))
  } finally { await new Promise(resolve=>server.close(resolve)) }
})

test('network/auth failures never report a successful upload',async()=>{
  const client=createHallClient({baseUrl:'https://db.invalid',getToken:async()=>{throw new Error('account changed')}})
  await assert.rejects(client.submit('player',record(400)),/account changed/)
  await assert.rejects(client.submit('../someone-else',record(400)),/클리어 기록/)
  await assert.rejects(client.list('daily'),/잘못된 모드/)
  const denied=createHallClient({baseUrl:'https://db.invalid',getToken:async()=>'x',fetchImpl:async()=>new Response('{}',{status:403})})
  await assert.rejects(denied.list('hard'),/연결하지 못했습니다/)
})

// Account records cannot be forked through a changing run ID or a second profile.
test('hall transport is permanently bound to its authenticated account',async()=>{
 const writes=[]
 const client=createHallClient({baseUrl:'https://db.invalid',uid:'google-owner',getToken:async()=>'token',fetchImpl:async(url,options)=>{
  writes.push({url,method:options.method})
  return new Response(options.method==='GET'?'null':'{}',{status:200,headers:{etag:'"1"'}})
 }})
 await assert.rejects(client.submit('other-account',record(300)),/계정/)
 assert.equal(writes.length,0)
 await client.submit('google-owner',record(300))
 assert(writes.every(x=>x.url.includes('/entries/google-owner.json')))
})
