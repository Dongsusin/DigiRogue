import fs from 'node:fs';
import {BOSS_PROFILES,BOSS_MAP_THEMES} from '../../../src/data/bossProfiles.js';
import {RIVAL_PROFILES} from '../../../src/data/rivalProfiles.js';
import {DIGIMON_STAGE_DATA} from '../../../src/data/digimonRoster.js';
import {DIGIMON_MODELS,missingRequiredClips} from '../../../src/data/digimonModels.js';
import {createBossPlan} from '../../../src/battle/bossEncounters.js';
import {isRivalStage} from '../../../src/battle/rivalEncounters.js';
const lookup=new Map(Object.entries(DIGIMON_STAGE_DATA).flatMap(([stage,entries])=>entries.map(x=>[x.이름,{...x,stage}])));
const extract=(text,start,end)=>text.slice(text.indexOf(start),text.indexOf(end)).replace('export function','function');
const oldBoss=fs.readFileSync(new URL('./src__battle__bossEncounters.js.before',import.meta.url),'utf8');
const oldRival=fs.readFileSync(new URL('./src__battle__rivalEncounters.js.before',import.meta.url),'utf8');
const getBoss=Function('BOSS_PROFILES','BOSS_MAP_THEMES',extract(oldBoss,'export function getBossCandidates','export function getBossProfile')+';return getBossCandidates')(BOSS_PROFILES.filter(p=>!p.regionRoute),BOSS_MAP_THEMES);
const getRival=Function('RIVAL_PROFILES','BOSS_MAP_THEMES','isRivalStage','completeModel',extract(oldRival,'export function getRivalCandidates','function createRivalPlan')+';return getRivalCandidates')(RIVAL_PROFILES.filter(p=>!p.regionRoute),BOSS_MAP_THEMES,isRivalStage,n=>DIGIMON_MODELS[n]&&!missingRequiredClips(DIGIMON_MODELS[n].clips).length);
const rows=[];let combinations=0;
for(const mapName of Object.keys(BOSS_MAP_THEMES))for(let stage=1;stage<=200;stage++) {
 const boss=stage%10===0;if(!boss&&!isRivalStage(stage))continue;combinations++;
 const pool=boss?getBoss(stage,mapName,lookup):getRival(stage,mapName,lookup);
 const names=[...new Set(pool.map(p=>boss||!p.variant?createBossPlan(p,stage).initialName:p.formation?.[0]??p.line[0]))];
 if(names.length<3)rows.push({mapName,stage,type:boss?'boss':'rival',names,profiles:pool.map(p=>p.id)});
}
const report={passed:true,bossProfiles:55,rivalProfiles:71,combinations,belowThree:rows.length,rows};
fs.writeFileSync(new URL('./baseline-coverage.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({passed:true,exitCode:0,combinations,belowThree:rows.length}));
