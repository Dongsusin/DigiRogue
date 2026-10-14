import fs from 'node:fs/promises';
const root='C:/Users/pdwea/Develop/digirouge',dir=root+'/.tmp-convert/roster-expansion-2026-10-13';
const research=JSON.parse(await fs.readFile(root+'/docs/research/digimon-additions-2026-10-13.json'));
const previous=JSON.parse(await fs.readFile(root+'/.tmp-convert/research-2026-10-13/official-candidate-profiles.json'));
const strip=s=>s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
let rows=[],next=0;
await Promise.all(Array.from({length:10},async()=>{while(next<research.candidates.length){const c=research.candidates[next++],p=previous.find(x=>x.english===c.english),id=c.officialProfile?.directory??p?.directory??c.english.toLowerCase().replace(/[^a-z0-9]/g,'');
try{const url='https://digimon.net/reference_ko/detail.php?directory_name='+id,r=await fetch(url,{signal:AbortSignal.timeout(15000)}),h=await r.text();const name=strip(h.match(/<title>([^<]+)\| 디지몬 도감/)?.[1]??'');
const fact=label=>h.match(new RegExp('<dt[^>]*>\\s*'+label+'\\s*</dt>\\s*<dd[^>]*>([\\s\\S]*?)</dd>'))?.[1]??'';
rows.push({english:c.english,directory:id,url,verified:!!name,name,stage:strip(fact('등급')),type:strip(fact('유형')),attribute:strip(fact('속성')),skills:fact('필살기').split(/<br\s*\/?>|・/).map(strip).filter(Boolean),profile:strip(h.match(/<p class="p-ref__txt -txtProfile">([\s\S]*?)<\/p>/)?.[1]??'')});
}catch(e){rows.push({english:c.english,directory:id,error:String(e),verified:false});}
}}));await fs.writeFile(dir+'/official-profiles.json',JSON.stringify(rows,null,2));console.log(JSON.stringify({checked:rows.length,verified:rows.filter(r=>r.verified).length}));