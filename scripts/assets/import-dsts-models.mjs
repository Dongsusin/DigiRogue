import {bakeFaceOverlays,repairDstsEyeShade} from './bake-dsts-faces.mjs';

import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const root=path.resolve(new URL('../../',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')).replaceAll('\\','/');
const requireTools=createRequire(root+'/.cache/asset-tools/package.json');
const {NodeIO,Logger}=requireTools('@gltf-transform/core');
const {ALL_EXTENSIONS}=requireTools('@gltf-transform/extensions');
const {dedup,prune,resample,meshopt,textureCompress,dequantize}=requireTools('@gltf-transform/functions');
const {MeshoptDecoder,MeshoptEncoder}=requireTools('meshoptimizer');
const runtimeRequire=createRequire('C:/Users/pdwea/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=runtimeRequire('sharp');
await MeshoptDecoder.ready;await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const option=(name,fallback)=>{const index=process.argv.indexOf(name);return index<0?fallback:process.argv[index+1]};
const workDate=option('--work-date','2026-10-13');
const cache=root+'/.cache/digimon-expansion-'+workDate;
const report=root+'/.tmp-convert/roster-expansion-'+workDate;
const nativeDeath=process.argv.includes('--native-death');
await fs.mkdir(cache+'/converted',{recursive:true});await fs.mkdir(cache+'/dsts',{recursive:true});await fs.mkdir(report,{recursive:true});
const research=JSON.parse(await fs.readFile(option('--research',root+'/docs/research/digimon-additions-2026-10-13.json'),'utf8'));
const only=process.argv.indexOf('--only');
const candidates=research.candidates.filter(c=>c.originalMotion&&c.sources.some(s=>s.kind==='public-viewer')&&(only<0||process.argv[only+1].split(',').includes(c.english)));
let results=[];try{results=JSON.parse(await fs.readFile(report+'/dsts-converted.json','utf8'))}catch{}
const canonical={bn01:'idle',ba01:'attack01',ba02:'attack02',bs01:'special01',bs02:'special02',bs03:'special03',bs04:'special04',bs05:'special05',bd01:'damage',...(nativeDeath?{bd03:'down'}:{bd02:'down'}),bg01:'guard',bg02:'dodge',br01:'move',bv01:'victory'};
async function convert(c) {
 const source=c.sources.find(s=>s.kind==='public-viewer'),slug=source.slug,input=cache+'/dsts/'+slug+'.glb',output=cache+'/converted/'+slug+'.glb';
 const previous=results.find(r=>r.english===c.english&&r.ok),revision=nativeDeath?8:7;
 if(previous&&previous.revision===revision){try{await fs.access(output);return previous}catch{}}
 try{
  let data;try{data=await fs.readFile(input)}catch{
   const response=await fetch('https://cdn.nuffle.me/v2/dsts-opt/digimon/'+slug+'/'+slug+'.glb',{signal:AbortSignal.timeout(60000)});
   if(!response.ok)throw Error('Download HTTP '+response.status);
   data=Buffer.from(await response.arrayBuffer());if(data.readUInt32LE(0)!==0x46546c67)throw Error('Not a GLB');
   await fs.writeFile(input,data);
  }
  const document=await io.readBinary(data);document.setLogger(new Logger(Logger.Verbosity.ERROR));
  const tree=document.getRoot(),animations=tree.listAnimations();
  const idle=animations.find(a=>/_bn01$/.test(a.getName()));if(!idle)throw Error('Missing native idle');
  const prefix=idle.getName().replace(/_bn01$/,'');const kept=[];
  for(const a of animations){
   const sourceName=a.getName(),role=sourceName.startsWith(prefix+'_')?canonical[sourceName.slice(prefix.length+1)]:null;
   if(!role){a.dispose();continue;}
   if(!a.listChannels().some(ch=>ch.getTargetNode()&&ch.getTargetPath()))throw Error('Empty original clip '+sourceName);
   a.setName(role);kept.push({sourceName,name:role});
  }
  const names=kept.map(a=>a.name);
  for(const [role,options]of Object.entries({idle:['idle'],attack:['attack01','attack02','special01','special02'],damage:['damage'],die:['down']}))if(!options.some(n=>names.includes(n)))throw Error('Missing '+role);
  for(const mesh of tree.listMeshes())for(const primitive of mesh.listPrimitives()){
   const mat=primitive.getMaterial();
   if(mat&&/outline|^edge$/i.test(mat.getName()))mesh.removePrimitive(primitive);
  }
  for(const node of tree.listNodes())if(node.getMesh()&&!node.getMesh().listPrimitives().length)node.setMesh(null);
  const faceBake=await bakeFaceOverlays(document);
  for(const material of tree.listMaterials()){
   material.setMetallicFactor(0).setMetallicRoughnessTexture(null).setRoughnessFactor(.78);
   const extras=material.getExtras();
   const diffuse=extras?.dsts?.texture_slots?.DiffuseColor;
   if(/^eye(?:_|$)/i.test(material.getName())&&diffuse){const texture=tree.listTextures().find(t=>t.getName()===diffuse);if(texture){material.setBaseColorTexture(texture);material.getBaseColorTextureInfo().setTexCoord(0);}}

   repairDstsEyeShade(material);
   const mode=extras?.dsts_render?.overlay_mode??'';
   if(/flame|fire|eff|_F$/i.test(material.getName())||mode){material.setAlphaMode('BLEND').setDoubleSided(true);}
   material.setExtras({});
  }
  // The game's standard renderer uses baked base-color maps; unused source shader
  // lookup/cubemap textures and story animations must not enlarge download payloads.
  document.getRoot().setExtras({});
  for(const node of tree.listNodes())node.setExtras({});
  for(const mesh of tree.listMeshes())mesh.setExtras({});
  await document.transform(dequantize(),resample(),dedup(),prune({keepExtras:false}),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:90}),meshopt({encoder:MeshoptEncoder,level:'medium'}));
  const binary=await io.writeBinary(document);await fs.writeFile(output,binary);
  const json=JSON.parse(Buffer.from(binary).subarray(20,20+Buffer.from(binary).readUInt32LE(12)).toString());
  const result={ok:true,revision,faceBake,english:c.english,name:c.koreanName||c.english,slug,inputBytes:data.length,bytes:binary.length,clips:json.animations.map(a=>a.name),originalClips:kept,meshes:json.meshes.length,skins:json.skins.length,url:'/models/digimon/'+slug+'.glb',source:{game:'Digimon Story: Time Stranger',asset:c.english,url:source.url,creator:'Nuffle',modelOrigin:'Bandai Namco / Media.Vision'},file:output};
  results=results.filter(r=>r.english!==c.english);results.push(result);
  await fs.writeFile(report+'/dsts-converted.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify({ok:true,name:result.name,sourceMB:+(data.length/1048576).toFixed(2),gameMB:+(binary.length/1048576).toFixed(2),clips:names}));
  return result;
 }catch(error){
  const result={ok:false,english:c.english,name:c.koreanName||c.english,error:String(error)};results=results.filter(r=>r.english!==c.english);results.push(result);
  await fs.writeFile(report+'/dsts-converted.json',JSON.stringify(results,null,2));console.log(JSON.stringify(result));return result;
 }
}
let next=0;
await Promise.all(Array.from({length:2},async()=>{while(next<candidates.length)await convert(candidates[next++]);}));
const successful=results.filter(r=>r.ok);console.log(JSON.stringify({completed:true,attempted:candidates.length,converted:successful.length,failed:results.filter(r=>!r.ok).length,bytes:successful.reduce((n,r)=>n+r.bytes,0)}));

if(results.some(r=>!r.ok))process.exitCode=1;
