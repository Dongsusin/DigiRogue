import test from 'node:test'
import assert from 'node:assert/strict'
import { placePopover } from '../src/layout/popoverLayout.js'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
const engine = await loadBattleEngine()
test('equipment inspection lists all five equipment groups with capped counts and real metadata', () => {
  const unit={typePowerUps:{백신:99},attributePowerUps:{화염:2},digiclones:{attack:3},recoveryPrograms:{'recovery-program-m':1},battleItems:{'steel-claw':1,'miracle-ruby':2}}
  const before=structuredClone(unit),items=engine.getCombatantEquippedItems?.(unit)??[]
  assert.deepEqual(Object.fromEntries(items.map(item=>[item.id,item.value])),{'type-up-백신':5,'attribute-up-화염':2,'digiclone-c':3,'recovery-program-m':1,'steel-claw':1,'miracle-ruby':2})
  assert(items.every(item=>item.name&&item.imageUrl&&item.description&&item.maxCount>=item.value));assert.deepEqual(unit,before)
  assert.match(items.find(item=>item.id==='digiclone-c').effectDescription,/18%/)
})
test('equipment inspection excludes empty slots, eggs, bag items and temporary buffs', () => {
  assert.deepEqual(engine.getCombatantEquippedItems?.({isEgg:true,battleItems:{'steel-claw':1}}),[])
  assert.deepEqual(engine.getCombatantEquippedItems?.({inventory:{'heal-20':3},activeBuffs:{attack:1},battleItems:{'steel-claw':0,unknown:9}}),[])
})

test('image-only equipment can overlap a wide trigger to keep every icon visible', () => {
  const bounds={left:12,top:12,right:1268,bottom:624}
  const anchor={left:230,right:1050,top:100,bottom:320,width:820,height:220}
  const size={width:382,height:338},result=placePopover(anchor,bounds,size,'overlay')
  assert.equal(result.height,size.height)
  assert(result.x>=bounds.left&&result.x+result.width<=bounds.right)
  assert(result.y>=bounds.top&&result.y+result.height<=bounds.bottom)
})
