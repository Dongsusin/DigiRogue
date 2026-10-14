import expansionHabitats from '../../src/data/expansionHabitats.json' with {type:'json'}
import {applyExpansionHabitats} from '../lib/expansion-habitats.mjs'
import retiredByRequestSpecies from '../../src/data/retiredByRequestSpecies.json' with {type:'json'};
import fs from 'node:fs/promises';
import path from 'node:path';
const root='C:/Users/pdwea/Develop/digirouge',dir=root+'/.tmp-convert/roster-expansion-2026-10-13';
const dryRun=process.argv.includes('--dry-run'), copies=[];
const read=async f=>JSON.parse(await fs.readFile(root+'/'+f,'utf8'));
const write=async(f,value)=>{if(dryRun)return;const file=root+'/'+f;let old='';try{old=await fs.readFile(file,'utf8');const backup=dir+'/before/'+f;await fs.mkdir(path.dirname(backup),{recursive:true});try{await fs.access(backup)}catch{await fs.writeFile(backup,old)}}catch{}const eol=old.includes('\r\n')?'\r\n':'\n';await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,(JSON.stringify(value,null,f.includes('Manifest')?1:2)+'\n').replace(/\n/g,eol));};
const profiles=await read('.tmp-convert/roster-expansion-2026-10-13/official-profiles.json');
const research=(await read('docs/research/digimon-additions-2026-10-13.json')).candidates;
const canonical=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases={'KoDokugumon':'Kodokugumon','RedVegimon':'RedVegiemon','Sakuyamon Maid Mode':'Sakuyamon Miko Mode'};
const design=(await fs.readFile(root+'/docs/asset-sources/roster-expansion7-design.csv','utf8')).trim().split('\n').slice(1).map(s=>{const [english,element,budget,build,parents]=s.split('|');return{english,element,budget:+budget,build,parents:parents.split(',')}});
const converted=[...await read('.tmp-convert/roster-expansion-2026-10-13/dsts-converted.json'),...await read('.tmp-convert/roster-expansion-2026-10-13/fbx-converted.json')].filter(r=>r.ok);
const modelFor=e=>{
 if(e==='PawnChessmon (Black)')return converted.find(r=>r.entry?.endsWith('g153_d.fbx'));
 if(e==='PawnChessmon (White)')return converted.find(r=>r.entry?.endsWith('g146_d.fbx'));
 if(e==='BlackGrowlmon')return converted.find(r=>r.entry?.endsWith('m216_d.fbx'));
 return converted.find(r=>canonical(aliases[r.english]??r.english)===canonical(e));
};
const manifest=await read('src/data/digimonModelManifest.json'),stageCatalog=await read('src/data/digimonStageProfiles.json'),reference=await read('docs/asset-sources/digimon-reference-types.json'),assignments=await read('src/data/digimonPassiveAssignments.json'),training=await read('src/data/evolutionTrainingProfiles.json'),attackProfiles=await read('src/data/attackProfiles.json'),skillInfo=await read('src/data/attackSkillInfo.json');
const stages=['유아기','유년기','성장기','성숙기','아머체','하이브리드체','완전체','궁극체','초궁극체'],data={};for(const stage of stages)data[stage]=await read('data/디지몬/'+stage+'.json');
const names=new Set(Object.values(data).flat().map(x=>x.이름)),allSkills=new Map();const skillFiles={};for(const file of await fs.readdir(root+'/data/기술'))if(file.endsWith('.json')){const rows=await read('data/기술/'+file);skillFiles[file]=rows;for(const r of rows)allSkills.set(r.기술명,r);}
const explicitNames={'Aegiochusmon: Blue':'아이기오투스몬[블루]','Aegiochusmon: Green':'아이기오투스몬[그린]','Aegiochusmon: Dark':'아이기오투스몬[다크]','Aegiochusmon: Holy':'아이기오투스몬[홀리]','Jupitermon Wrath Mode':'유피테르몬[래스 모드]','Chronomon Holy Mode':'크로노몬[홀리 모드]','Chronomon Destroy Mode':'크로노몬[디스트로이 모드]','Bacchusmon Deisui Mode':'바커스몬[만취 모드]','Ceresmon Medium':'케레스몬[미디엄]','Cerberumon Werewolf Mode':'케르베로스몬[인랑]','Sakuyamon Miko Mode':'샤크라몬[무녀 모드]','Imperialdramon':'황제드라몬[드래곤]','Giromon':'째리몬'};
const eligible=[];
for(const d of design){
 const model=modelFor(d.english),official=profiles.find(p=>p.english===d.english);if(!model||!official?.verified)continue;
 const name=explicitNames[d.english]??official.name.replace(/^그레이트 /,'그레이트');
 if(retiredByRequestSpecies.includes(name))continue;
 const bytes=await fs.readFile(model.file),json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12))),clips=(json.animations??[]).map(a=>a.name);
 if(!['idle','damage','down'].every(c=>clips.includes(c))||!clips.some(c=>/^attack|^special/.test(c)))continue;
 const stage=d.english==='Jupitermon Wrath Mode'||d.english==='GraceNovamon'||d.english==='Ordinemon'?'초궁극체':official.stage.startsWith('유아기')?'유아기':official.stage.startsWith('유년기')?'유년기':stages.find(s=>official.stage.startsWith(s));
 if(!stage)throw Error('Unknown stage '+name);
 eligible.push({...d,name,model:{...model,clips},official,stage,json});
}
const byEnglish=new Map(eligible.map(d=>[d.english,d.name]));for(const e of eligible)names.add(e.name);
const resolve=n=>byEnglish.get(n)??({Andromon:'안드로몬','게소몬':'연체몬','나니몬':'모야몬','왕거북몬':'왕거북몬','스파이더몬':'스파이더몬','리볼몬':'카우보이몬','아이스몬':'블루메라몬'}[n]??n);
const content={exclusiveParents:{'유피테르몬':['아이기오투스몬[홀리]'],'유피테르몬[래스 모드]':['유피테르몬'],'크로노몬[홀리 모드]':['부텐몬'],'크로노몬[디스트로이 모드]':['부텐몬']},addedAt:'2026-10-13',names:eligible.map(x=>x.name),branches:{},directions:{},items:{},modes:{},levels:{},jogress:[],combat:{}};
const addBranch=(s,t)=>{s=resolve(s);t=resolve(t);if(!names.has(s)||!names.has(t)||s===t)return;content.branches[s]=[...new Set([...(content.branches[s]??[]),t])];};
const art='/items/evolution/canonical/evoluter.png';
const addItem=(target,from,itemName,level,rarity='rogue',method='특수 진화',imageUrl=art)=>{target=resolve(target);from=from.map(resolve).filter(n=>names.has(n)&&n!==target);if(!names.has(target)||!from.length)throw Error('Unreachable catalyst '+target);content.items[target]={from,itemName,itemId:'item-evolution-expansion7-'+(eligible.find(d=>d.name===target)?.model.slug??target),imageUrl,rarity,level,itemCount:1,method};for(const s of from)addBranch(s,target);};
const weights={balance:[1.2,1,1,1,1,1],flame:[1.2,1.12,.98,1.42,.85,.85],skirmisher:[1.03,1.17,.85,1.13,.92,1.5],hybrid:[1.2,1.4,1.05,1.3,1,.95],artillery:[1.3,.7,1.13,1.65,.95,.55],nature:[1.3,.82,1.12,1.18,1.3,.72],assassin:[.95,1.5,.75,.85,.8,1.7],holy:[1.3,.85,1.05,1.12,1.55,.9],caster:[1.05,.65,.85,1.6,1.15,1.05],gunner:[1.1,.85,1,1.5,.95,1.6],support:[1.45,.5,1.12,.85,1.55,.95],bruiser:[1.55,1.5,1.22,.7,1,.65],duelist:[1.1,1.5,1.08,.85,1,1.3],aerial:[1.05,1,.8,1.3,.95,1.6],tank:[1.65,.95,1.65,.65,1.15,.5],beast:[1.35,1.4,1,.65,.85,1.2],machine:[1.4,1.22,1.58,.92,1.02,.55],calamity:[1.45,1.12,1.12,1.65,1.18,.6],slime:[1.75,.6,.85,.85,1.22,.85],fortress:[1.5,.68,1.65,.88,1.65,.4],striker:[1.12,1.5,1.03,.68,.85,1.12]};
const passives={flame:'flame',skirmisher:'swift',hybrid:'signature',artillery:'precision',nature:'regeneration',assassin:'elusive',holy:'radiance',caster:'sorcerer',gunner:'precision',support:'healer',bruiser:'resolve',duelist:'brawler',aerial:'storm',tank:'armor',beast:'ferocity',machine:'steel',calamity:'darkness',slime:'sturdy',fortress:'magic-ward',balance:'receptive',striker:'brawler'};
const fields=['체력','공격','방어','특공','특방','스피드'],trainFields=['hp','attack','defense','specialAttack','specialDefense','speed'];
const palettes={화염:['#ff6a20','#ffe59a','#a72014'],물:['#3db9ed','#d3faff','#155180'],얼음:['#8ceaff','#ffffff','#2d75b4'],바람:['#76dfc8','#e3ffed','#287e83'],번개:['#ffdc4e','#fffbe3','#5f62d5'],빛:['#ffe29a','#ffffff','#c08a36'],어둠:['#9562db','#f6b2ec','#231335'],나무:['#72c965','#fff0b2','#286c42'],강철:['#75b3d8','#e3f8ff','#36465f'],흙:['#c29461','#ffe5af','#65513e'],무:['#77cfe0','#f2ffff','#3b6575']};
const styleFor=(s,d)=>{
 if(/브레스|플레임|파이어|화이어|불꽃|네로 코로소/.test(s))return{style:'breath',anchor:'mouth'};
 if(/레이저|캐논|캐넌|광선|빔|포격/.test(s))return{style:'beam',anchor:/캐논|포격/.test(s)?'cannon':'mouth'};
 if(/불릿|블릿|블렛|트리거|바주카|보머|봄$/.test(s))return{style:/보머|봄$/.test(s)?'bomb':'bullet',anchor:'weapon'};
 if(/커터|시저|베기|검|슬래|리퍼|브레이커|월아참|일섬/.test(s))return{style:'slash',anchor:'weapon'};
 if(/펀치|너클|녹다운|블로|어택|갤럽/.test(s))return{style:'punch',anchor:'hands'};
 if(/썬더|번개|라이트닝|볼트/.test(s))return{style:'lightning',anchor:'hands'};
 if(/토네|허리케인|스톰|토르나/.test(s))return{style:'vortex',anchor:'body'};
 if(/곡|에코|포효|헤르츠/.test(s))return{style:'sound',anchor:'mouth'};
 if(/스레드|네일|침|포이즌/.test(s))return{style:'needle',anchor:'hands'};
 return{style:['duelist','assassin','striker','bruiser','beast'].includes(d.build)?'claw':'orb',anchor:'hands'};
};
const restored=[];
for(const d of eligible){
 const {name,stage,official,model}=d,existing=Object.values(data).flat().find(x=>x.이름===name);if(existing)throw Error('Existing form conflict '+name);
 for(const p of d.parents.filter(x=>!x.startsWith('@')))addBranch(p,name);
 let skills=official.skills.filter(s=>s&&!/該当なし/.test(s));if(d.english==='Sakuyamon Miko Mode')skills=['디보션 필드','무녀의 결계'];if(!skills.length)throw Error('No canon move '+name);
 const w=weights[d.build],total=w.reduce((a,b)=>a+b),stats=Object.fromEntries(fields.map((f,i)=>[f,Math.round(d.budget*w[i]/total)]));stats.체력+=d.budget-Object.values(stats).reduce((a,b)=>a+b);
 const type=official.attribute==='배리어블'?'프리':official.attribute||'무';
 const species={이름:name,속성:d.element,타입:type,크기:stage==='유아기'||stage==='유년기'?1:stage==='성장기'?2:stage==='성숙기'||stage==='아머체'?3:4,...stats,진화조건:{레벨:stage==='성장기'?3:stage==='성숙기'?10:stage==='완전체'?25:45,...stats},진화가능:[],기술:skills,어티치먼트:[]};
 data[stage].push(species);const trainingStage=stage==='하이브리드체'&&d.budget>=650?'완전체':stage;
 stageCatalog.profiles[name]={stage,trainingStage,directory:official.directory,source:official.url,...(stage==='초궁극체'?{classification:{source:official.url,note:'게임 내 최종 융합·최종 모드 분류; 공식 도감은 궁극체'}}:{})};
 content.combat[name]={budget:d.budget,build:d.build,source:official.url};training[name]={stats:w.map((v,i)=>[v,trainFields[i]]).sort((a,b)=>b[0]-a[0]).slice(0,2).map(x=>x[1])};assignments[name]={id:passives[d.build]};
 const officialAttribute={'백신':'Vaccine','데이터':'Data','바이러스':'Virus','프리':'Free','배리어블':'Variable','불명':'Unknown','NO DATA':'NO DATA'}[official.attribute];
 reference.references.push({name,directory:official.directory,officialName:d.english,attribute:officialAttribute??'',...(officialAttribute?{}:{gameType:type})});
 manifest[name]={url:'/models/digimon/'+model.slug+'.glb',clips:model.clips,source:{...model.source,...(model.authoredMotion?{authoredMotion:model.authoredMotion}:{})},...(model.authoredMotion?{authoredMotion:model.authoredMotion}:{})};
 copies.push([model.file,root+'/public'+manifest[name].url]);
 for(const [folder,suffix]of [['thumbs','thumb'],['previews','preview']])copies.push([dir+'/portraits/'+model.slug+'-'+suffix+'.webp',root+'/public/models/digimon/'+folder+'/'+model.slug+'.webp']);
 const boneNames=(d.json.skins??[]).flatMap(s=>s.joints.map(i=>d.json.nodes[i].name)).filter(Boolean),bone=(...patterns)=>patterns.flatMap(re=>boneNames.filter(n=>re.test(n)))[0]??null;
 const anchors={head:bone(/head/i,/kao/i),mouth:bone(/head/i,/mouth/i),eyes:bone(/head/i),weapon:bone(/weapon|sword|gun|staff|buki/i,/hand|te[lr]/i),hands:bone(/hand.*r|hand_r/i,/hand|te[lr]/i),feet:bone(/toe|foot/i),body:bone(/center|hips|root/i),cannon:bone(/gun|cannon|weapon/i),wings:bone(/wing|hane/i),tail:bone(/tail|shippo/i)};anchors.hand=anchors.hands;anchors.chest=bone(/spine|mune/i);anchors.back=anchors.chest;anchors.overhead=anchors.head;
 const clipData={};for(const a of d.json.animations??[])if(/^attack|^special/.test(a.name)){const duration=Math.max(...a.samplers.map(s=>d.json.accessors[s.input].max?.[0]??0));clipData[a.name]={duration,markers:{hand:.5,weapon:.5,mouth:.5}};}
 const signatures={};content.directions[name]=skills.map((skill,index)=>{
 const fx=styleFor(skill,d);const physical=['slash','punch','claw'].includes(fx.style),clip=physical&&model.clips.includes('attack01')?'attack01':model.clips.includes('special'+String(index+1).padStart(2,'0'))?'special'+String(index+1).padStart(2,'0'):model.clips.includes('special01')?'special01':'attack01';
 signatures[skill]={...fx,bone:anchors[fx.anchor]??anchors.body,clip,duration:clipData[clip]?.duration??2,marker:.5,timingSource:'native-clip-midpoint'};
 if(!skillInfo[skill])skillInfo[skill]={...fx,attribute:d.element,area:/シャワー|샤워|레인|월드|전체|러시|스콜/.test(skill)};
 if(!allSkills.has(skill)){const area=skillInfo[skill].area===true,base=stage==='유아기'||stage==='유년기'?35:stage==='성장기'?55:stage==='성숙기'||stage==='아머체'?75:stage==='완전체'?100:stage==='궁극체'?125:150;const row={기술명:skill,데미지:base+(index===1?10:0),명중률:'100%',분류:physical?'물리형':'특수형',속성:d.element,전체공격:area};
 if(/독|포이즌/.test(skill)){row.상태이상='중독';row.상태이상확률='25%';}
 if(/썬더|번개|스턴/.test(skill)){row.상태이상='마비';row.상태이상확률='20%';}
 const file=(['아머체','하이브리드체'].includes(stage)?trainingStage==='완전체'?'완전체':'성숙기':stage)+'.json';skillFiles[file].push(row);allSkills.set(skill,row);}
 return fx;
 });
 attackProfiles[name]={anchors,signature:signatures,clips:clipData};
 if(stage==='궁극체'||stage==='초궁극체')addItem(name,d.parents.filter(x=>!x.startsWith('@')),'에보류터 · '+name,d.budget>=1100?95:d.budget>=1000?80:65,d.budget>=1050?'master':'rogue');
 restored.push(name);
}
const rule=(target,parents,item,lv,rarity='rogue',method='특수 진화',image=art)=>{if(byEnglish.has(target)||names.has(target))addItem(target,parents,item,lv,rarity,method,image)};
for(const [mode,item]of [['Blue','기계족 합성 코어'],['Green','식물족 합성 코어'],['Dark','암흑 합성 코어'],['Holy','성역 합성 코어']])rule('Aegiochusmon: '+mode,['Aegiochusmon',...['Blue','Green','Dark','Holy'].filter(x=>x!==mode).map(x=>'Aegiochusmon: '+x)],item,35,'rare','모드 체인지');
rule('유피테르몬',['Aegiochusmon: Holy'],'신왕의 뇌정',80,'rogue');
rule('Jupitermon Wrath Mode',['유피테르몬'],'분노의 케라우노스',110,'master','모드 체인지');
rule('Chronomon Holy Mode',['Butenmon'],'성시의 크로노 코어',85,'master');
rule('Chronomon Destroy Mode',['Butenmon'],'멸시의 크로노 코어',85,'master');
rule('MedievalGallantmon',['그레이드몬','메가로그라우몬','Mistymon'],'메디벌 듀나스',85,'master');
rule('ClavisAngemon',['홀리엔젤몬'],'성문을 여는 열쇠',75);
rule('SlashAngemon',['홀리엔젤몬','나이트몬'],'홀리 에스파다',75);
rule('Parallelmon',['와이즈몬','Astamon'],'평행세계 코어',100,'master');
rule('ZombiePlutomon',['플루토몬'],'명계의 불멸 코어',105,'master');
rule('VictoryGreymon',['메탈그레이몬','워그레이몬','라이즈그레이몬'],'드라몬 브레이커',85,'master');
rule('Bacchusmon Deisui Mode',['Bacchusmon'],'신주의 잔',75,'rogue','모드 체인지');
rule('Cerberumon Werewolf Mode',['Cerberumon'],'인랑의 인자',40,'rare','모드 체인지');
rule('Ceresmon Medium',['케레스몬'],'케레스의 성역',65,'rogue','모드 체인지');
rule('Sakuyamon Miko Mode',['샤크라몬'],'무녀의 방울',65,'rogue','모드 체인지');
rule('GrandisKuwagamon',['그랜쿠가몬'],'그랑 킬러',85,'master','모드 체인지');
rule('Imperialdramon',['파일드라몬'],'포지트론 코어',65);
if(byEnglish.has('Imperialdramon')){rule('황제드라몬[파이터]',['파일드라몬','Imperialdramon'],'포지트론 레이저',60,'rare','모드 체인지');content.items['황제드라몬[파이터]'].itemId='item-evolution-포지트론 레이저';content.items['황제드라몬[파이터]'].imageUrl='/아이템/진화/포지트론 레이저.png';}
for(const [e,source,item,artName]of [['Digmon','아르마몬','지식의 디지멘탈','knowledge'],['Submarimon','아르마몬','성실의 디지멘탈','reliability'],['Halsemon','호크몬','사랑의 디지멘탈','love'],['Shurimon','호크몬','순수의 디지멘탈','sincerity'],['Pegasusmon','파닥몬','희망의 디지멘탈','hope'],['Nefertimon','가트몬','빛의 디지멘탈','light'],['Allomon','호크몬','용기의 디지멘탈','courage']]){
 const knownArt=Object.values(await read('src/data/evolutionItemArt.json')).find(x=>x.name===item)?.url??art;rule(e,[source],item,15,'rare','아머 진화',knownArt);
}
for(const [e,s,lv]of [['Aldamon',['아그니몬','브리트라몬'],40],['BeoWolfmon',['볼프몬','가름몬'],40],['JetSilphymon',['Kazemon','Zephyrmon'],40],['Zephyrmon',['Kazemon'],25],['Korikakumon',['Kumamon'],25],['Calmaramon',['Ranamon'],25]])rule(e,s,'융합 스피릿 · '+resolve(e),lv,'rare','스피릿 진화','/items/evolution/canonical/spirit-light.png');
for(const [e,s]of [['Kazemon',['피요몬','호크몬']],['Kumamon',['SnowGoburimon','Penguinmon']],['Loweemon',['로프몬','임프몬']],['Ranamon',['쉬라몬','베타몬']]])rule(e,s,'휴먼 스피릿 · '+resolve(e),15,'rare','스피릿 진화','/items/evolution/canonical/spirit-light.png');
for(const [target,materials,lv]of [['GraceNovamon',['Apollomon','디아나몬'],100],['Ordinemon',['오파니몬[폴다운]','라구엘몬'],100],['Boltboutamon',['피에몬','묘티스몬'],90]])if(byEnglish.has(target)){const name=resolve(target);content.jogress.push({targetName:name,materials:materials.map(resolve),level:lv});content.items[name].level=lv;}
for(const [s,t]of [['Gigimon','길몬'],['Gummymon','테리어몬'],['Kokomon','로프몬'],['Yuramon','시드몬'],['Pichimon','뽀글몬'],['MetalKoromon','Kapurimon'],['제리몬','초코몬'],['TiaLudomon','RaijiLudomon'],['RaijiLudomon','BryweLudramon'],['Locomon','그랜드로코몬'],['Reapmon','베르제브몬'],['코만드라몬','Tankdramon'],['다크드라몬','카오스몬']])addBranch(s,t);
const eggs=await read('data/디지몬/디지에그.json');for(const d of eligible)for(const entry of d.parents.filter(x=>x.startsWith('@'))){const egg=eggs.find(e=>e.이름===entry.slice(1));if(egg&&!egg.부화가능.includes(d.name))egg.부화가능.push(d.name);}
for(const d of eligible){const parents=Object.entries(content.branches).filter(([,ts])=>ts.includes(d.name)).map(([n])=>n);if(!parents.length&&!eggs.some(e=>e.부화가능.includes(d.name)))throw Error('No evolution parent or egg: '+d.name);}
for(const stage of stages)for(const raw of data[stage]){if(content.names.includes(raw.이름))raw.진화가능=content.branches[raw.이름]??[];raw.진화가능=(raw.진화가능??[]).filter(t=>t!=='유피테르몬'||raw.이름===resolve('Aegiochusmon: Holy'));}
const maps=applyExpansionHabitats(await read('data/map.json'),expansionHabitats);
for(const [source]of copies)await fs.access(source);
if(!dryRun)for(const [source,target]of copies)await fs.copyFile(source,target);
const retired=await read('src/data/retiredAuthoredAttackSpecies.json');const restoreAliases=new Set([...restored,...research.filter(c=>eligible.some(d=>d.english===c.english)).map(c=>c.koreanName)]);
await write('src/data/retiredAuthoredAttackSpecies.json',retired.filter(n=>!restoreAliases.has(n)));
await write('src/data/rosterExpansion7.json',content);await write('src/data/digimonModelManifest.json',manifest);await write('src/data/digimonStageProfiles.json',stageCatalog);reference.verifiedAt='2026-10-13';await write('docs/asset-sources/digimon-reference-types.json',reference);
await write('src/data/digimonPassiveAssignments.json',assignments);await write('src/data/evolutionTrainingProfiles.json',training);await write('src/data/attackProfiles.json',attackProfiles);await write('src/data/attackSkillInfo.json',skillInfo);
for(const stage of stages)await write('data/디지몬/'+stage+'.json',data[stage]);for(const [file,rows]of Object.entries(skillFiles))await write('data/기술/'+file,rows);
await write('data/디지몬/디지에그.json',eggs);await write('data/map.json',maps);
const evidence=eligible.map(d=>({name:d.name,english:d.english,modelSource:d.model.source,originalClips:d.model.originalClips,authoredMotion:d.model.authoredMotion,motionCleanup:d.model.motionCleanup,official:{directory:d.official.directory,url:d.official.url,stage:d.official.stage,type:d.official.attribute,skills:d.official.skills},gameStage:d.stage,budget:d.budget,build:d.build,parents:Object.entries(content.branches).filter(([,targets])=>targets.includes(d.name)).map(([name])=>name)}));
await write('docs/asset-sources/roster-expansion7-evidence.json',evidence);
console.log(JSON.stringify({exitCode:0,added:eligible.length,items:Object.keys(content.items).length,branches:Object.values(content.branches).reduce((n,a)=>n+a.length,0),roster:Object.values(data).flat().length,skippedDesign:design.filter(d=>!eligible.some(e=>e.english===d.english)).map(d=>d.english)}));
