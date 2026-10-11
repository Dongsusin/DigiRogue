import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import vm from 'node:vm'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { brotliCompressSync } from 'node:zlib'
const origin = 'https://game.example'
const subject = await import('../src/loading/gameDownload.js')
const generator = await import('./lib/game-asset-manifest.mjs')
const hash = data => createHash('sha256').update(data).digest('hex').slice(0,16)
const asset = (name, data) => ({ path: name, url: name+'?v='+hash(data), revision: hash(data), bytes: Buffer.byteLength(data), downloadBytes: Buffer.byteLength(data) })
class MemoryCache {
  entries = new Map()
  async match(key) { return this.entries.get(String(key))?.clone() }
  async put(key, response) { this.entries.set(String(key), response.clone()) }
  async keys() { return [...this.entries.keys()].map(url => new Request(url)) }
}
const manifest = entries => ({ schema: 1, version: hash(JSON.stringify(entries)), assets: entries, totalBytes: entries.reduce((sum,a)=>sum+a.bytes,0), downloadBytes: entries.reduce((sum,a)=>sum+a.downloadBytes,0) })
const response = data => new Response(data,{headers:{'Content-Type':'application/octet-stream'}})
const run = (assets, options) => subject.downloadGameAssets(manifest(assets), { origin, concurrency:2, ...options })
test('manifest covers shipped assets and chunks and downloads each model once', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(),'digirogue-manifest-'))
  try {
    for (const [name,data] of Object.entries({'models/a.glb':'model','models/a.glb.br':brotliCompressSync(Buffer.from('model')),'assets/game.js':'export {}','images/한글.png':'picture','index.html':'<html></html>','.vite/manifest.json':'{}','game-assets.json':'old'})) {
      await fs.mkdir(path.dirname(path.join(dir,name)),{recursive:true}); await fs.writeFile(path.join(dir,name),data)
    }
    const result = await generator.createGameAssetManifest(dir,{compressedModels:true})
    assert.deepEqual(result.assets.map(a=>a.path).sort(),['/assets/game.js','/images/한글.png','/index.html','/models/a.glb.br'].sort())
    const model = result.assets.find(a=>a.path.endsWith('.br'))
    assert.equal(model.bytes,5); assert.equal(model.revision,hash('model'))
    assert.equal(model.url,'/models/a.glb.br?v='+hash('model'))
    assert.equal(result.totalBytes,5+9+7+13)
    const next = await generator.createGameAssetManifest(pathToFileURL(dir),{compressedModels:true})
    assert.equal(next.version,result.version)
  } finally { await fs.rm(dir,{recursive:true,force:true}) }
})
test('cold download waits for every file, verifies contents and reports completion', async () => {
  const cache = new MemoryCache(), calls=[], states=[]
  const entries=[asset('/models/a.glb','model'),asset('/images/한글.png','picture')]
  const result=await run(entries,{cache,fetcher:async url=>{calls.push(url);return response(url.includes('a.glb')?'model':'picture')},onProgress:s=>states.push(s)})
  assert.equal(result.completed,2); assert.equal(calls.length,2)
  assert.equal(states.at(-1).loadedBytes,12); assert.equal(states.at(-1).completed,2)
  assert.equal(await (await cache.match(origin+'/models/a.glb?v='+hash('model'))).text(),'model')
})
test('warm start reads persistent cache without asset downloads', async () => {
  const cache=new MemoryCache(), entries=[asset('/image.png','data')]
  await run(entries,{cache,fetcher:async()=>response('data')})
  const result=await run(entries,{cache,fetcher:()=>{assert.fail('Warm start fetched unchanged data')}})
  assert.equal(result.completed,1);assert.equal(result.reused,1)
})
test('changed content replaces only the outdated cached file', async () => {
  const cache=new MemoryCache(), before=[asset('/a.png','a'),asset('/b.png','b')]
  await run(before,{cache,fetcher:async url=>response(url.includes('/a.png')?'a':'b')})
  const calls=[]
  await run([asset('/a.png','new'),before[1]],{cache,fetcher:async url=>{calls.push(url);return response('new')}})
  assert.equal(calls.length,1);assert.match(calls[0],/a\.png/)
})
test('interrupted downloads retain finished files and retry only missing ones', async () => {
  const cache=new MemoryCache(), entries=[asset('/a.png','a'),asset('/b.png','b')]
  await assert.rejects(run(entries,{cache,concurrency:1,fetcher:async url=>{if(url.includes('/b.png'))throw new Error('offline');return response('a')}}),/offline/)
  const calls=[]
  await run(entries,{cache,fetcher:async url=>{calls.push(url);return response('b')}})
  assert.equal(calls.length,1);assert.match(calls[0],/b\.png/)
})
test('HTML fallback, wrong size and wrong hash are rejected without caching', async () => {
  for (const bad of [new Response('<html>',{headers:{'Content-Type':'text/html'}}),response('longer'),response('evil')]) {
    const cache=new MemoryCache()
    await assert.rejects(run([asset('/a.glb','good')],{cache,fetcher:async()=>bad}),/파일|검증|데이터/)
    assert.equal(cache.entries.size,0)
  }
})
test('parallel downloads are bounded and in-flight progress is visible', async () => {
  let active=0,max=0;const states=[]
  await run(Array.from({length:7},(_,i)=>asset('/'+i+'.png','abc')),{cache:new MemoryCache(),fetcher:async()=>{
    active++;max=Math.max(max,active)
    return new Response(new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('a'));setTimeout(()=>{controller.enqueue(new TextEncoder().encode('bc'));controller.close();active--},5)}}))
  },onProgress:s=>states.push(s)})
  assert.equal(max,2);assert.ok(states.some(s=>s.loadedBytes>0 && s.completed<7));assert.equal(states.at(-1).loadedBytes,21)
})
test('cache write failure blocks completion and does not delete existing data', async () => {
  const cache=new MemoryCache();cache.put=async()=>{throw new DOMException('full','QuotaExceededError')}
  await assert.rejects(run([asset('/a.png','a')],{cache,fetcher:async()=>response('a')}),/저장|공간/)
})
test('manifest rejects outside-origin URLs and ambiguous duplicate paths', async () => {
  const good=asset('/a.png','a')
  for(const entries of [[{...good,url:'https://evil.example/a.png'}],[good,good],[{...good,path:'/../a.png'}]]) {
    await assert.rejects(run(entries,{cache:new MemoryCache(),fetcher:()=>assert.fail('Invalid manifest performed a download')}),/목록|경로/)
  }
})
async function workerHarness(cache, {offline=false}={}) {
  const handlers=new Map(), network=[]
  const source=await fs.readFile(new URL('../public/game-cache-sw.js',import.meta.url),'utf8').catch(()=> '/* Worker has not been implemented */')
  const context={self:{location:{origin},addEventListener:(name,fn)=>handlers.set(name,fn),skipWaiting:()=>{},clients:{claim:()=>{}}},caches:{open:async()=>cache},fetch:async request=>{network.push(request);if(offline)throw new TypeError('offline');return response('network')},URL,Request,Response,Headers,Uint8Array}
  vm.runInNewContext(source,context)
  assert.ok(handlers.has('fetch'),'Downloaded assets must be served to actual game requests')
  return {network,async request(url,headers,mode) {
    const request=new Request(url,{headers});if(mode)Object.defineProperty(request,'mode',{value:mode})
    let result;handlers.get('fetch')({request,respondWith:p=>{result=p}})
    return result ? await result : null
  }}
}
test('worker serves normal and versioned game requests from downloaded assets',async()=>{
  const cache=new MemoryCache();await run([asset('/images/a.png','image')],{cache,fetcher:async()=>response('image')})
  await cache.put(origin+'/game-assets.json',Response.json(manifest([asset('/images/a.png','image')])))
  const worker=await workerHarness(cache)
  assert.equal(await (await worker.request(origin+'/images/a.png')).text(),'image')
  assert.equal(await (await worker.request(origin+'/images/a.png?v='+hash('image'))).text(),'image')
  assert.equal(worker.network.length,0)
  assert.equal(await (await worker.request(origin+'/images/a.png?v=0000000000000000')).text(),'network')
})
test('worker leaves auth and external traffic alone and supports cached audio ranges',async()=>{
  const cache=new MemoryCache();await run([asset('/BGM/song.ogg','abcdef')],{cache,fetcher:async()=>response('abcdef')})
  await cache.put(origin+'/game-assets.json',Response.json(manifest([asset('/BGM/song.ogg','abcdef')])))
  const worker=await workerHarness(cache)
  assert.equal(await worker.request('https://accounts.google.com/identity'),null)
  assert.equal(await worker.request(origin+'/api/auth'),null)
  assert.equal(await worker.request(origin+'/__/auth/iframe.js'),null)
  assert.equal(await worker.request(origin+'/api/profile.json'),null)
  const partial=await worker.request(origin+'/BGM/song.ogg',{Range:'bytes=2-4'})
  assert.equal(partial.status,206);assert.equal(await partial.text(),'cde');assert.equal(partial.headers.get('content-range'),'bytes 2-4/6')
  assert.equal(worker.network.length,0)
})

function browserEnvironment(cache, fetcher) {
  return { location: { protocol: 'https:', origin }, crypto: globalThis.crypto, fetch: fetcher,
    caches: { open: async () => cache }, navigator: { serviceWorker: { register: async()=>({}), ready: Promise.resolve(), controller: {} } } }
}
test('browser preparation persists the manifest only after the complete installation',async()=>{
  const cache=new MemoryCache(), entries=manifest([asset('/a.png','a')]), states=[]
  const environment=browserEnvironment(cache,async url=>url.endsWith('game-assets.json')?Response.json(entries):response('a'))
  const result=await subject.prepareGameDownload({environment,onProgress:s=>states.push(s)})
  assert.equal(result.completed,1);assert.equal(states.at(-1).phase,'ready')
  assert.equal((await (await cache.match(origin+'/game-assets.json')).json()).version,entries.version)
})
test('offline entry can reuse a previously completed manifest and all its files',async()=>{
  const cache=new MemoryCache(), entries=manifest([asset('/a.png','a')])
  await run(entries.assets,{cache,fetcher:async()=>response('a')})
  await cache.put(origin+'/game-assets.json',Response.json(entries))
  let calls=0
  const result=await subject.prepareGameDownload({environment:browserEnvironment(cache,async()=>{calls++;throw new TypeError('offline')})})
  assert.equal(result.reused,1);assert.equal(calls,1)
})
test('failed installations do not save a completed manifest or report readiness',async()=>{
  const cache=new MemoryCache(), states=[], entries=manifest([asset('/a.png','a')])
  await assert.rejects(subject.prepareGameDownload({environment:browserEnvironment(cache,async url=>url.endsWith('game-assets.json')?Response.json(entries):response('bad')),onProgress:s=>states.push(s)}),/파일/)
  assert.equal(await cache.match(origin+'/game-assets.json'),undefined)
  assert.ok(states.every(s=>s.phase!=='ready'))
})
test('installed launcher starts from disk without fetching or changing browser storage',async()=>{
  assert.deepEqual(await subject.prepareGameDownload({environment:{location:{protocol:'file:'}}}),{installed:true})
  assert.deepEqual(await subject.prepareGameDownload({environment:{location:{protocol:'https:'},auroraGame:{}}}),{installed:true})
})
test('insufficient quota blocks transfers without deleting existing cached files',async()=>{
  const cache=new MemoryCache();await cache.put(origin+'/keep.png',response('keep'))
  await assert.rejects(run([asset('/a.png','a')],{cache,estimate:async()=>({usage:100,quota:101}),fetcher:()=>assert.fail('Insufficient space should block transfers')}),/공간/)
  assert.equal(await (await cache.match(origin+'/keep.png')).text(),'keep')
})

test('literal percent and Korean item filenames are encoded safely and reused',async()=>{
  const item={...asset('/아이템/부활칩(50%).png','chip'),url:'/%EC%95%84%EC%9D%B4%ED%85%9C/%EB%B6%80%ED%99%9C%EC%B9%A9(50%25).png?v='+hash('chip')}
  const cache=new MemoryCache(), calls=[]
  await run([item],{cache,fetcher:async url=>{calls.push(url);return response('chip')}})
  assert.equal(calls[0],origin+item.url)
  assert.equal(await (await cache.match(origin+item.url)).text(),'chip')
})

test('plus-sign item filenames keep the actual public URL and cache encoded equivalents',async()=>{
  const item=asset('/items/exp+.png','xp'),cache=new MemoryCache(),calls=[]
  await run([item],{cache,fetcher:async url=>{calls.push(url);return response('xp')}})
  assert.equal(calls[0],origin+'/items/exp+.png?v='+hash('xp'))
  await cache.put(origin+'/game-assets.json',Response.json(manifest([item])))
  const worker=await workerHarness(cache)
  assert.equal(await (await worker.request(origin+'/items/exp+.png')).text(),'xp')
  assert.equal(await (await worker.request(origin+'/items/exp%2B.png')).text(),'xp')
  assert.equal(worker.network.length,0)
})

test('an interrupted update preserves the previous complete offline installation',async()=>{
  const cache=new MemoryCache(), old=manifest([asset('/index.html','old shell'),asset('/a.png','old')])
  await run(old.assets,{cache,fetcher:async url=>response(url.includes('index.html')?'old shell':'old')})
  await cache.put(origin+'/game-assets.json',Response.json(old))
  const update=manifest([asset('/index.html','new shell'),asset('/a.png','new')])
  await assert.rejects(run(update.assets,{cache,concurrency:1,fetcher:async url=>{if(url.includes('a.png'))throw new Error('offline');return response('new shell')}}),/offline/)
  const restored=await subject.prepareGameDownload({environment:browserEnvironment(cache,async()=>{throw new TypeError('offline')})})
  assert.equal(restored.reused,2)
  const worker=await workerHarness(cache,{offline:true})
  assert.equal(await (await worker.request(origin+'/',undefined,'navigate')).text(),'old shell')
  assert.equal(await (await worker.request(origin+'/a.png')).text(),'old')
})
test('an entry from an older deployment reloads instead of mounting incompatible game chunks',async()=>{
  const cache=new MemoryCache(), current=manifest([asset('/assets/entry-new.js','new')]);let reloaded=0,files=0
  const environment=browserEnvironment(cache,async url=>{if(url.endsWith('game-assets.json'))return Response.json(current);files++;return response('new')})
  environment.document={querySelector:()=>({src:origin+'/assets/entry-old.js'})}
  environment.location.reload=()=>{reloaded++}
  await assert.rejects(subject.prepareGameDownload({environment}),/업데이트|새로고침/)
  assert.equal(reloaded,1);assert.equal(files,0);assert.equal(cache.entries.size,0)
})
