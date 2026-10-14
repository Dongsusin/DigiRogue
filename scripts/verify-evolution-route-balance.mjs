import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveEvolutionInvestment } from '../src/data/evolutionInvestment.js'
import { getEvolutionInvestment, ITEM_EVOLUTION_REQUIREMENTS, JOGRESS_RECIPES } from '../src/data/evolutionRules.js'
import { balanceSpecies, balanceSkill, BALANCE_REVISION } from '../src/balance/catalog.js'
import { getLoreProfile } from '../src/balance/loreProfiles.js'
import { pickWildEncounterNames } from '../src/progression/gameDifficulty.js'
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs'
const e = await loadBattleEngine()

test('route rewards compare equal starting profiles: item > fusion > stat, including compound routes', () => {
  const ordinary = resolveEvolutionInvestment('test')
  const fusions = [2,3,4].map(n => resolveEvolutionInvestment('test', { recipe: { materials: Array(n).fill('parent') } }))
  const items = ['good','rare','rogue','master'].map(rarity => resolveEvolutionInvestment('test', { item: { rarity } }))
  for (const fusion of fusions) {
    assert(fusion.statBonus > ordinary.statBonus)
    assert(fusion.skillMultiplier > ordinary.skillMultiplier)
    for (const item of items) {
      assert(item.statBonus > fusion.statBonus)
      assert(item.skillMultiplier > fusion.skillMultiplier)
    }
  }
  for (let i=1;i<items.length;i++) assert(items[i].statBonus > items[i-1].statBonus)
  const hybrid = resolveEvolutionInvestment('test', { item: {rarity:'master'}, recipe:{materials:['a','b','c']} })
  assert(hybrid.statBonus > items.at(-1).statBonus)
  assert(hybrid.trainingMultiplier >= items.at(-1).trainingMultiplier)
  assert.equal(hybrid.itemCount, 1)
})

test('removed catalysts and itemless mode changes cannot retain master item rewards', () => {
  assert.equal(getEvolutionInvestment('오그도몬').route, 'level')
  assert.equal(getEvolutionInvestment('오그도몬').statBonus, 0)
  assert.equal(getEvolutionInvestment('알파몬[왕룡검]').route, 'jogress')
  assert.equal(getEvolutionInvestment('알파몬[왕룡검]').statBonus, getEvolutionInvestment('오메가몬').statBonus)
  assert.equal(resolveEvolutionInvestment('test', {mode:{level:60}}).statBonus, 0)
})

test('a scarce catalyst does not erase native generation strength or individual combat identities', () => {
  for (const [lower,higher] of [['아그니몬','워그레이몬'],['브리트라몬','메탈가루몬'],['화염드라몬','메탈그레이몬']]) {
    const weak=e.allDigimonLookup.get(lower),strong=e.allDigimonLookup.get(higher)
    assert(weak && strong, lower)
    assert(weak.전투총합 < strong.전투총합, lower+' vs '+higher)
  }
  const profile=getLoreProfile('워그레이몬')
  const skill=balanceSkill({기술명:'comparison',데미지:100,속성:'화염',분류:'물리형'})
  const raw={이름:'워그레이몬',기술:['comparison']}
  const data=balanceSpecies(raw,'궁극체',new Map([['comparison',skill]]))
  assert.equal(data.전투역할, profile.role)
})

test('every real species uses the current route while wild/boss profiles and shared move users remain independent', () => {
  for (const d of e.allDigimonLookup.values()) {
    const investment=getEvolutionInvestment(d.이름), profile=getLoreProfile(d.이름)
    assert.equal(investment.route, ITEM_EVOLUTION_REQUIREMENTS[d.이름] ? 'item' : JOGRESS_RECIPES.some(r=>r.targetName===d.이름) ? 'jogress' : 'level',d.이름)
    assert.equal(d.전투총합, Math.round(profile.budget*(1+investment.statBonus)),d.이름)
    assert.equal(d.야생전투설정.전투총합,profile.budget,d.이름)
    assert.equal(d.전투역할,profile.role,d.이름)
    for(const name of d.기술) {
      const move=d.기술설정[name],wild=d.야생전투설정.기술설정[name]
      if(move.효과||move.분류==='보조형') assert.deepEqual(move,wild,d.이름)
      else assert(move.데미지>=wild.데미지 && move.데미지<=250,d.이름+':'+name)
    }
  }
  assert.equal(e.getSkillData('베이비 플레임',{name:'아구몬'}).데미지,e.allDigimonLookup.get('아구몬').기술설정['베이비 플레임'].데미지)
})

test('revision-5 saves migrate both increases and reductions once, preserving HP ratio, equipment and skill order', () => {
  assert(BALANCE_REVISION>5)
  for (const name of ['오그도몬','알파몬[왕룡검]','아그니몬','오메가몬[X항체]']) {
    const d=e.allDigimonLookup.get(name)
    const current=e.createCombatant({id:name,name,data:d,level:150})
    const old=e.refreshCombatantStats({...current,balanceRevision:5,baseStats:Object.fromEntries(Object.entries(current.baseStats).map(([k,v])=>[k,Math.round(v*1.2)])),battleItems:{'steel-claw':2},skills:[...current.skills].reverse()})
    old.currentHp=Math.floor(old.maxHp*.37)
    const state={currentStage:191,currentMap:'기어 포레스트',gameMode:'classic',player:old,party:[old],enemies:[],activeAllyIds:[old.id],inventory:{'heal-20':3},trainerSkills:{}}
    const loaded=e.parseSavedGameState(JSON.stringify({version:1,gameState:state}))
    assert(loaded,name)
    assert.equal(loaded.player.balanceRevision,BALANCE_REVISION)
    assert.deepEqual(loaded.player.baseStats,current.baseStats)
    assert(Math.abs(loaded.player.currentHp/loaded.player.maxHp-old.currentHp/old.maxHp)<.01,name)
    assert.deepEqual(loaded.player.skills,old.skills)
    assert.deepEqual(loaded.player.battleItems,old.battleItems)
    assert.deepEqual(loaded.inventory,state.inventory)
    const twice=e.parseSavedGameState(JSON.stringify({version:1,gameState:loaded}))
    assert.deepEqual([twice.player.maxHp,twice.player.currentHp], [loaded.player.maxHp,loaded.player.currentHp])
  }
})


test('player investment never changes native map eligibility, fallback or seeded encounter weighting', () => {
  const native = new Map([...e.allDigimonLookup].map(([name,d])=>[name,{...d,전투총합:d.야생전투설정.전투총합}]))
  const mountain=e.getMapEncounterGroups('미하라시 산')[3]
  assert(mountain.includes('슈츠몬'))
  assert(pickWildEncounterNames(mountain,e.allDigimonLookup,mountain.length,35,()=>.37).includes('슈츠몬'))
  for(const map of Object.keys(e.mapData))for(const stage of [10,25,35,45,65,100,150,195]) {
    const groups=e.getMapEncounterGroups(map)
    for(const pool of Object.values(groups))for(const roll of [0,.37,.99])
      assert.deepEqual(pickWildEncounterNames(pool,e.allDigimonLookup,2,stage,()=>roll),pickWildEncounterNames(pool,native,2,stage,()=>roll),map+':'+stage+':'+roll)
  }
})

test('native fallback uses the weakest real enemies while legacy catalogs without native profiles remain supported', () => {
  const entries=[['a',{전투총합:1800,야생전투설정:{전투총합:900}}],['b',{전투총합:1200,야생전투설정:{전투총합:950}}],['c',{전투총합:1150,야생전투설정:{전투총합:1100}}]]
  assert.deepEqual(pickWildEncounterNames(['a','b','c'],new Map(entries),3,1,()=>0),['a','b'])
  const legacy=new Map([['a',{전투총합:400}],['b',{전투총합:800}]])
  assert.deepEqual(pickWildEncounterNames(['a','b'],legacy,2,1,()=>0),['a'])
})
