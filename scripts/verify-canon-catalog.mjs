import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { loadBattleEngine } from './lib/battle-engine-fixture.mjs';
import { ADVENTURE_BATTLE_ITEMS } from '../src/data/adventureItems.js';
import { getEvolutionItemArtUrl } from '../src/data/evolutionItemArt.js';
const engine = await loadBattleEngine();
const unit = (name, id = name) => engine.createCombatant({ id, name, data: engine.allDigimonLookup.get(name), level: 90 });
for (const [name,type,target,expected] of [
 ['듀크몬[크림슨]','바이러스','데이터',2],
 ['듀크몬[X항체]','바이러스','데이터',2],
 ['매그너몬','프리','백신',1],
 ['가드로몬(골드)','프리','바이러스',1],
]) test(name+' uses its reference-book type in real battle matchups',()=>{
 const member=unit(name);
 assert.equal(member.type,type);
 assert.equal(engine.getMatchupResult({attackerType:member.type,skillAttribute:'무',defenderType:target,defenderAttribute:'무'}).multiplier,expected);
});
test('fire Beast and Human Spirit rewards display the two distinct official sculptures',()=>{
 const item=ADVENTURE_BATTLE_ITEMS.find(x=>x.id==='beast-spirit-fire');
 const beast=fs.readFileSync(new URL('../public'+item.imageUrl,import.meta.url));
 const human=fs.readFileSync(new URL('../public'+getEvolutionItemArtUrl('불꽃의 휴먼 스피릿'),import.meta.url));
 assert.equal(crypto.createHash('sha256').update(beast).digest('hex'),'de0604c884b6a9539c09b6bf5035d6b866fafcf0017b262753986c2669adca62');
 assert.notDeepEqual(beast,human);
});
test('resuming refreshes stale species type and element for party, player, enemies, support and pending recruits',()=>{
 const stale=(name,id=name)=>({...unit(name,id),type:'백신',attribute:'얼음'});
 const ally=stale('듀크몬'),reserve=stale('가드로몬(골드)'),enemy=stale('듀크몬[X항체]'),support=stale('매그너몬');
 const state={gameMode:'classic',currentStage:190,currentMap:'시작의마을',player:ally,party:[ally,reserve],enemies:[enemy],activeAllyIds:[ally.id],inventory:{'heal-20':2},gold:1234,trainerSkills:{},regionalSupport:{stage:190,mapName:'시작의마을',unit:support},pendingPartyAdmissions:[{id:'pending',kind:'scan',member:stale('매그너몬','pending-magnamon')}]};
 const raw=JSON.stringify({version:1,gameState:state});const loaded=engine.parseSavedGameState(raw);assert(loaded);
 for(const u of [loaded.player,...loaded.party,...loaded.enemies,loaded.regionalSupport.unit,...loaded.pendingPartyAdmissions.map(x=>x.member)]){
   const data=engine.allDigimonLookup.get(u.name);assert.equal(u.type,data.타입,u.name+': stale type');assert.equal(u.attribute,data.속성,u.name+': stale element');
 }
 assert.equal(loaded.gold,1234);assert.deepEqual(loaded.inventory,state.inventory);assert.equal(JSON.stringify({version:1,gameState:state}),raw);
 const again=engine.parseSavedGameState(JSON.stringify({version:1,gameState:loaded}));assert.equal(again.party[0].type,loaded.party[0].type);assert.equal(again.party[0].currentHp,loaded.party[0].currentHp);
});

test('the complete roster agrees with the independently fetched official form attributes and explicit unverified game exceptions', () => {
  const catalog = JSON.parse(fs.readFileSync(new URL('../docs/asset-sources/digimon-reference-types.json', import.meta.url), 'utf8'));
  const profiles = JSON.parse(fs.readFileSync(new URL('../src/data/digimonStageProfiles.json', import.meta.url), 'utf8')).profiles;
  const attributes = { Vaccine: '백신', Data: '데이터', Virus: '바이러스', Free: '프리', Variable: '프리', Unknown: '불명', 'NO DATA': '불명' };
  const recorded = [...catalog.references, ...catalog.gameReferences];
  assert.equal(new Set(recorded.map(entry => entry.name)).size, recorded.length, 'duplicate form evidence');
  assert.deepEqual(recorded.map(entry => entry.name).sort(), [...engine.allDigimonLookup.keys()].sort(), 'roster audit coverage');
  for (const entry of catalog.references) {
    assert.equal(profiles[entry.name].directory, entry.directory, entry.name + ': wrong form reference');
    const expected = entry.attribute ? attributes[entry.attribute] : entry.gameType;
    assert(expected, entry.name + ': unhandled official attribute');
    assert.equal(unit(entry.name).type, expected, entry.name + ': wrong combat type');
  }
  for (const entry of catalog.gameReferences) {
    assert.equal(unit(entry.name).type, entry.type, entry.name + ': explicit game-only classification');
    assert(entry.reason && entry.source, entry.name + ': missing limitation/provenance');
  }
  assert.equal(profiles['메탈그레이몬'].directory, 'metalgreymon-v');
  assert.equal(profiles['메탈그레이몬[크로스워즈]'].directory, 'metalgreymon');
  assert.equal(profiles['치비카메몬'].directory, undefined, 'ChibiKamemon must not masquerade as Kamemon');
});

test('all fixed, random and evolution rewards resolve to readable local artwork', () => {
  const rewards = [...engine.fixedRewardItems, ...engine.randomRewardItemPool];
  assert(rewards.length > 100, 'reward audit unexpectedly empty');
  for (const item of rewards) {
    assert(item.imageUrl?.startsWith('/'), item.id + ': missing local artwork URL');
    const image = fs.readFileSync(new URL('../public' + item.imageUrl, import.meta.url));
    assert(image.length > 0, item.id + ': empty image');
    const header = image.subarray(0, 12);
    assert(header.readUInt32BE(0) === 0x89504e47 || header.readUInt16BE(0) === 0xffd8 ||
      (header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP'), item.id + ': invalid image');
  }
});
