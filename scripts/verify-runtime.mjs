import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { BATTLE_CARDS, BATTLE_CONSUMABLES } from '../src/battle/battleItems.js'
import { ADVENTURE_BATTLE_ITEMS, ADVENTURE_UTILITY_ITEMS, ADVENTURE_CONSUMABLES } from '../src/data/adventureItems.js'
import adventureArt from '../src/data/adventureItemArt.json' with { type: 'json' }
import cardArt from '../src/data/battleCardArt.json' with { type: 'json' }
import evolutionArt from '../src/data/evolutionItemArt.json' with { type: 'json' }
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DIGIMON_MODELS, missingRequiredClips, hasAuthoredAttackMotion, getDigimonThumbnailUrl, getDigimonPreviewUrl } from '../src/data/digimonModels.js'
import { bgmTracks } from '../src/audio/bgmCatalog.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const assets = path.join(root, process.argv.includes('--dist') ? 'dist' : 'public')
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
const stageFiles = fs.readdirSync(path.join(root, 'data/디지몬')).filter(file => file.endsWith('.json') && file !== '디지에그.json')
const species = stageFiles.flatMap(file => readJson(path.join(root, 'data/디지몬', file)))
const roster = new Set(species.map(unit => unit.이름))
assert.equal(roster.size, species.length, 'Duplicate roster species')
assert.deepEqual([...roster].sort(), Object.keys(DIGIMON_MODELS).sort(), 'Roster/model mismatch')
let bytes = 0, clips = 0
for (const [name, model] of Object.entries(DIGIMON_MODELS)) {
  assert.deepEqual(missingRequiredClips(model.clips), [], name + ': required motion missing')
  assert.equal(hasAuthoredAttackMotion(model), false, name + ': authored attack')
  const binary = fs.readFileSync(path.join(assets, model.url))
  assert.equal(binary.readUInt32LE(0), 0x46546c67, name + ': invalid GLB')
  assert.equal(binary.readUInt32LE(8), binary.length, name + ': truncated GLB')
  const gltf = JSON.parse(binary.subarray(20, 20 + binary.readUInt32LE(12)).toString('utf8'))
  assert(gltf.meshes?.length, name + ': missing geometry')
  assert((gltf.images || []).every(image => image.bufferView !== undefined), name + ': external texture')
  assert.deepEqual(gltf.animations.map(clip => clip.name).sort(), [...model.clips].sort(), name + ': clip mismatch')
  for (const url of [getDigimonThumbnailUrl(name), getDigimonPreviewUrl(name)]) assert(fs.statSync(path.join(assets, url)).size > 0, name + ': missing portrait')
  bytes += binary.length; clips += model.clips.length
}
const slugs = Object.values(DIGIMON_MODELS).map(model => path.basename(model.url, '.glb')).sort()
for (const [folder, extension] of [['', '.glb'], ['thumbs', '.webp'], ['previews', '.webp']]) {
  const files = fs.readdirSync(path.join(assets, 'models/digimon', folder)).filter(file => file.endsWith(extension)).map(file => path.basename(file, extension)).sort()
  assert.deepEqual(files, slugs, 'Missing/unused model assets: ' + folder)
}
for (const unit of species) for (const target of unit.진화가능 || []) assert(roster.has(target), unit.이름 + ': missing evolution ' + target)
for (const egg of readJson(path.join(root, 'data/디지몬/디지에그.json'))) for (const target of egg.부화가능 || []) assert(roster.has(target), egg.이름 + ': missing hatch target')
const maps = readJson(path.join(root, 'data/map.json'))
for (const [area, data] of Object.entries(maps)) for (const pool of Object.values(data.등장디지몬 || {})) for (const name of pool) assert(roster.has(name), area + ': unknown encounter ' + name)
const app = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8')
const musicUrls = bgmTracks.map(track => track.url)
assert.equal(new Set(musicUrls).size, 10, 'AI music catalog incomplete or duplicated')
for (const url of musicUrls) assert(fs.statSync(path.join(assets, url)).size > 0, 'Missing BGM: ' + url)
assert(!fs.readdirSync(path.join(assets, 'BGM'), { recursive: true }).some(file => /\.(m4a|mp4)$/i.test(file)), 'Retired BGM audio/video must not ship')
for (const folder of ['테이머', 'SFX', '도감', '이미지', '애니메이션']) assert(!fs.existsSync(path.join(assets, folder)), 'Unused asset folder: ' + folder)
const cardIds = new Set()
for (const item of BATTLE_CARDS) {
  assert(!cardIds.has(item.id), 'Duplicate card ' + item.id); cardIds.add(item.id)
  const art = cardArt[item.id]
  assert(art && art.cardCode === item.cardCode && art.url === item.imageUrl, 'Card artwork mismatch: ' + item.id)
  assert(item.consumable && item.maxOwned > 0 && item.price === undefined, 'Card acquisition mismatch: ' + item.id)
  const image = fs.readFileSync(path.join(assets, item.imageUrl))
  assert.equal(image.readUInt32BE(0), 0x89504e47, 'Card is not PNG: ' + item.id)
  assert.equal(image.readUInt32BE(16), art.width); assert.equal(image.readUInt32BE(20), art.height)
  assert.equal(crypto.createHash('sha256').update(image).digest('hex'), art.sha256, 'Card art changed: ' + item.id)
}
assert.deepEqual(Object.keys(cardArt).sort(), [...cardIds].sort(), 'Unused/missing card artwork metadata')
assert.deepEqual(fs.readdirSync(path.join(assets, 'items/cards')).filter(file => file.endsWith('.png')).sort(),
  BATTLE_CARDS.map(item => item.cardCode + '.png').sort(), 'Unused/missing card images')
const adventureItems = [...ADVENTURE_BATTLE_ITEMS, ...ADVENTURE_UTILITY_ITEMS, ...ADVENTURE_CONSUMABLES]
const adventureIds = new Set()
for (const item of adventureItems) {
  assert(!adventureIds.has(item.id), 'Duplicate adventure item ' + item.id); adventureIds.add(item.id)
  const art = adventureArt[item.id]
  assert(art && art.url === item.imageUrl && art.name === item.name, 'Adventure artwork mismatch: ' + item.id)
  const image = fs.readFileSync(path.join(assets, item.imageUrl))
  assert.equal(crypto.createHash('sha256').update(image).digest('hex'), art.sha256, 'Adventure art changed: ' + item.id)
  if (item.imageUrl.endsWith('.png')) {
    assert.equal(image.readUInt32BE(0), 0x89504e47, 'Adventure art is not PNG: ' + item.id)
    assert.equal(image.readUInt32BE(16), art.width); assert.equal(image.readUInt32BE(20), art.height)
  } else assert.equal(image.readUInt16BE(0), 0xffd8, 'Adventure art is not JPEG: ' + item.id)
}
assert.deepEqual(Object.keys(adventureArt).sort(), [...adventureIds].sort(), 'Unused/missing adventure artwork metadata')
assert.deepEqual(fs.readdirSync(path.join(assets, 'items/adventure')).sort(),
  adventureItems.filter(item => item.imageUrl.startsWith('/items/adventure/')).map(item => path.basename(item.imageUrl)).sort(),
  'Unused/missing adventure item images')
for (const [id, art] of Object.entries(evolutionArt)) {
  const image = fs.readFileSync(path.join(assets, art.url))
  if (image.readUInt32BE(0) === 0x89504e47) {
    assert.equal(image.readUInt32BE(16), art.width, 'Evolution art width: ' + id)
    assert.equal(image.readUInt32BE(20), art.height, 'Evolution art height: ' + id)
  } else assert.equal(image.readUInt16BE(0), 0xffd8, 'Evolution art is not PNG/JPEG: ' + id)
  assert.equal(crypto.createHash('sha256').update(image).digest('hex'), art.sha256, 'Evolution art changed: ' + id)
}
assert.deepEqual(BATTLE_CONSUMABLES.filter(item => !item.cardCode).map(item => item.id).sort(),
  ADVENTURE_CONSUMABLES.map(item => item.id).sort(), 'Missing ordinary battle supplies')
if (process.argv.includes('--dist')) {
  const html = fs.readFileSync(path.join(assets, 'index.html'), 'utf8')
  for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) assert(fs.existsSync(path.join(assets, match[1])), 'Missing entry resource ' + match[1])
  assert(!fs.existsSync(path.join(assets, 'dev')), 'Development pages shipped')
}
console.log(JSON.stringify({ok:true,assets,models:roster.size,clips,modelBytes:bytes,portraits:slugs.length*2,bgm:musicUrls.length,maps:Object.keys(maps).length,battleCards:cardIds.size,battleSupplies:ADVENTURE_CONSUMABLES.length,adventureItems:adventureIds.size,evolutionItemArt:Object.keys(evolutionArt).length}))
