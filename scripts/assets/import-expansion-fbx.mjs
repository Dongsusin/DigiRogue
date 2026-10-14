import {repairImportedFaceLayers} from './repair-imported-faces.mjs';
import {selectNativeModelClips} from '../lib/native-model-clips.mjs';
import {bakeNextOrderEyes} from './bake-next-order-eyes.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
const option=(name,fallback)=>{const index=process.argv.indexOf(name);return index<0?fallback:process.argv[index+1]};
const root='C:/Users/pdwea/Develop/digirouge',workDate=option('--work-date','2026-10-13'),dir=root+'/.tmp-convert/roster-expansion-'+workDate,cache=root+'/.cache/digimon-expansion-'+workDate;
const requireNativeDown=process.argv.includes('--require-native-down');
const req=createRequire(root+'/.cache/asset-tools/package.json'),{unzipSync}=req('fflate'),{NodeIO,Logger}=req('@gltf-transform/core'),{ALL_EXTENSIONS}=req('@gltf-transform/extensions'),{dedup,prune,resample,textureCompress,meshopt,reorder,quantize}=req('@gltf-transform/functions'),{MeshoptDecoder,MeshoptEncoder}=req('meshoptimizer');
const sharp=createRequire('C:/Users/pdwea/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('sharp');
await MeshoptDecoder.ready;await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
globalThis.window=globalThis;T.Object3D.prototype.bind??=function(){};
globalThis.FileReader=class {readAsArrayBuffer(b){b.arrayBuffer().then(x=>{this.result=x;this.onloadend?.()})}readAsDataURL(b){b.arrayBuffer().then(x=>{this.result='data:'+b.type+';base64,'+Buffer.from(x).toString('base64');this.onloadend?.()})}};
T.TextureLoader.prototype.load=function(url){const t=new T.Texture();t.name=String(url);t.userData.originalUrl=String(url);return t};
const archives=JSON.parse(await fs.readFile(option('--archives',dir+'/archive-inspection.json')));
if(workDate==='2026-10-13')archives.push({id:'339862',url:'https://web.archive.org/web/20230806121620id_/https://www.models-resource.com/download/57080/'},{id:'344113',url:'https://models.spriters-resource.com/media/assets/341/344113.zip?updated=1755512386'});
let result=[];try{result=JSON.parse(await fs.readFile(dir+'/fbx-converted.json'))}catch{};await fs.mkdir(cache+'/fbx-converted',{recursive:true});
for(const record of archives){
if(record.error||(process.argv.includes('--only')&&record.id!==process.argv[process.argv.indexOf('--only')+1]))continue;
let z;try{z=unzipSync(await fs.readFile(cache+'/tmr/'+record.id+'.zip'))}catch{continue}
for(const [entry,buf]of Object.entries(z).filter(([n])=>/\.fbx$/i.test(n)&&!/\(Early\)|\/Beta\//i.test(n))){
if(record.entry&&record.entry!==entry)continue;
try{
const scene=new FBXLoader().parse(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');
scene.name='ImportedRoot';const native=scene.animations;
const picked=selectNativeModelClips(native);
for(const role of record.dropClips??[])delete picked[role];
if(!picked.attack01&&picked.special01)picked.attack01=picked.special01;
if(!picked.idle||!picked.attack01||!picked.damage)throw Error('Missing original idle / attack / hit');
if(requireNativeDown&&!picked.down)throw Error('Missing original defeat/death');
const clips=[],originalClips=[];
for(const [name,clip]of Object.entries(picked))if(clip){const c=clip.clone();c.name=name;clips.push(c);originalClips.push({sourceName:clip.name,name});}
let meshes=0,bones=0;const texByName=new Map();const drops=[];
scene.traverse(o=>{if(o.isBone)bones++;if(!o.isMesh)return;if(record.dropMeshes?.includes(o.name)){o.visible=false;return;}meshes++;const mats=Array.isArray(o.material)?o.material:[o.material];o.material=mats.map((m,i)=>{const url=m.map?.userData.originalUrl??m.map?.name;const base=String(url??'').replaceAll('\\','/').split('/').pop();const files=Object.keys(z).filter(n=>/\.(png|jpg|tga)$/i.test(n)&&! /matcap|mask|sss|spec|normal|cubemap/i.test(n));const folder=entry.slice(0,entry.lastIndexOf('/')+1);
const swappedBase=record.textureSwap?.[base]??base;
const texture=Object.keys(z).find(n=>n===folder+swappedBase)??Object.keys(z).find(n=>n.split('/').pop()===swappedBase)??files.find(n=>n.startsWith(folder)&&/base|diff|texture/i.test(n));
const name='material_'+meshes+'_'+i;
if(record.dropMaterials?.includes(m.name))drops.push([o,i]);
const out=new T.MeshStandardMaterial({name,color:0xffffff,metalness:0,roughness:.8,side:T.DoubleSide});if(texture)texByName.set(name,texture);
else if(/effect|eff|line|outline/i.test(m.name))out.visible=false;
return out;});if(!Array.isArray(mats)||mats.length===1)o.material=o.material[0];if(o.geometry.attributes.color)o.geometry.deleteAttribute('color');
});
for(const o of new Set(drops.map(([mesh])=>mesh))){const excluded=new Set(drops.filter(([mesh])=>mesh===o).map(([,index])=>index));const geometry=o.geometry;const originalIndex=geometry.index?.array??Array.from({length:geometry.attributes.position.count},(_,i)=>i),indices=[],groups=[];for(const group of geometry.groups){if(excluded.has(group.materialIndex))continue;groups.push({start:indices.length,count:group.count,materialIndex:group.materialIndex});indices.push(...originalIndex.slice(group.start,group.start+group.count));}if(!indices.length)throw Error('Variant filtering removed entire mesh');geometry.setIndex(indices);geometry.clearGroups();for(const group of groups)geometry.addGroup(group.start,group.count,group.materialIndex);}
if(!meshes||!bones)throw Error('No skinned geometry');
const originalDown=!!picked.down;
if(!originalDown){const q0=scene.quaternion.clone(),q1=q0.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),-Math.PI/8));clips.push(new T.AnimationClip('down',.9,[new T.QuaternionKeyframeTrack('ImportedRoot.quaternion',[0,.3,.9],[...q0.toArray(),...q0.toArray(),...q1.toArray()])]));}
// Mesh centre drift is fixed at the rig root, preserving original limb/weapon poses.
// Candidate root is the deepest common bone ancestor, including armatures on multi-root rigs.
const boneList=[];scene.traverse(o=>{if(o.isBone)boneList.push(o)});
let common=boneList[0];while(common&&boneList.filter(b=>{for(let n=b;n;n=n.parent)if(n===common)return true;return false}).length<boneList.length*.8)common=common.parent;
if(common&&common!==scene){
 const saved=[];scene.traverse(o=>saved.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]));
 const restore=()=>saved.forEach(([o,p,q,s])=>{o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s)});
 const bounds=()=>{scene.updateMatrixWorld(true);const b=new T.Box3();scene.traverse(o=>{if(o.isSkinnedMesh){o.computeBoundingBox();b.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld))}});return b};
 restore();let mix=new T.AnimationMixer(scene);mix.clipAction(clips.find(c=>c.name==='idle')).play();mix.update(0);const box=bounds(),center=box.getCenter(new T.Vector3()),extent=box.getSize(new T.Vector3()).length();mix.stopAllAction();mix.uncacheRoot(scene);restore();
 for(const clip of clips.filter(c=>c.name!=='idle'&&c.name!=='down')){restore();mix=new T.AnimationMixer(scene);mix.clipAction(clip).play();const times=[],values=[];
 for(let i=0;i<=Math.ceil(clip.duration*30);i++){const t=Math.min(i/30,clip.duration-.001);mix.setTime(t);const c=bounds().getCenter(new T.Vector3());const delta=c.sub(center),world=common.getWorldPosition(new T.Vector3());delta.x=Math.abs(delta.x)>extent*.15?delta.x-Math.sign(delta.x)*extent*.15:0;delta.z=Math.abs(delta.z)>extent*.15?delta.z-Math.sign(delta.z)*extent*.15:0;delta.y=Math.min(0,delta.y+extent*.15);world.sub(delta);common.parent.worldToLocal(world);times.push(t);values.push(...world.toArray());}
 mix.stopAllAction();mix.uncacheRoot(scene);clip.tracks=clip.tracks.filter(t=>t.name!==common.name+'.position');clip.tracks.push(new T.VectorKeyframeTrack(common.name+'.position',times,values));}
 restore();
}
const json=await new GLTFExporter().parseAsync(scene,{binary:false,animations:clips,trs:true,onlyVisible:true});
const doc=await io.readJSON({json,resources:{}});doc.setLogger(new Logger(Logger.Verbosity.ERROR));
const textures=new Map();for(const m of doc.getRoot().listMaterials()){const file=texByName.get(m.getName());if(!file)continue;let texture=textures.get(file);if(!texture){texture=doc.createTexture(path.basename(file)).setImage(await sharp(z[file]).flip().png().toBuffer()).setMimeType('image/png');textures.set(file,texture)}m.setBaseColorTexture(texture);if(/flame|fire|eff/i.test(file))m.setAlphaMode('BLEND');}
const nativeEyeFile=Object.keys(z).find(n=>n.startsWith(entry.slice(0,entry.lastIndexOf('/')+1))&&/_e00.png$/i.test(n));let faceBake;if(originalClips.some(c=>/^a0_/.test(c.sourceName))&&nativeEyeFile)faceBake=await bakeNextOrderEyes(doc,await sharp(z[nativeEyeFile]).flip().png().toBuffer());
await repairImportedFaceLayers(doc);
await doc.transform(resample(),dedup(),prune(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:90}),...(requireNativeDown?[reorder({encoder:MeshoptEncoder,target:'size'}),quantize({pattern:/^(?!POSITION$).*/,patternTargets:/^(?!POSITION$).*/})]:[meshopt({encoder:MeshoptEncoder,level:'medium'})]));
// Preserve local POSITION units on these skinned FBX rigs. Re-quantizing positions
// moves the decode scale into inverse binds and breaks hidden-part area comparisons.
if(requireNativeDown)doc.createExtension(req('@gltf-transform/extensions').EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:req('@gltf-transform/extensions').EXTMeshoptCompression.EncoderMethod.QUANTIZE});
const binary=await io.writeBinary(doc);const siblings=Object.keys(z).filter(n=>n.startsWith(entry.split('/')[0]+'/')&&/\.fbx$/i.test(n)&&! /\(Early\)|\/Beta\//i.test(n));const slug=record.slug??entry.split('/')[0].toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+(siblings.length>1?'-'+path.basename(entry,'.fbx'):'');const file=cache+'/fbx-converted/'+slug+'.glb';await fs.writeFile(file,binary);
const encoded=JSON.parse(Buffer.from(binary).subarray(20,20+Buffer.from(binary).readUInt32LE(12)));if(!encoded.animations?.some(a=>a.name==='idle')||!encoded.animations.some(a=>a.name==='attack01')||!encoded.animations.some(a=>a.name==='damage')||!encoded.animations.some(a=>a.name==='down'))throw Error('Export dropped required animations');
const r={ok:true,faceBake,id:record.id,entry,english:record.english??entry.split('/')[0],variant:{textureSwap:record.textureSwap,dropMaterials:record.dropMaterials,dropClips:record.dropClips,dropMeshes:record.dropMeshes},slug,file,bytes:binary.length,clips:clips.map(c=>c.name),originalClips,authoredMotion:originalDown?undefined:{roles:['down'],reason:'Original attack/idle/hit retained; terminal collapse only'},source:{game:({'mobile/digimonrearise':'Digimon ReArise','mobile/digimonfusionfighters':'Digimon Fusion Fighters','mobile/digimonnewcentury':'Digimon New Century','digimonworldnextorder':'Digimon World: Next Order'}[record.game])??(originalClips.some(c=>/_rd$/.test(c.sourceName))?'Digimon ReArise':originalClips.some(c=>/^a0_/.test(c.sourceName))?'Digimon World: Next Order':'Digimon New Century'),asset:entry.split('/')[0],url:record.url},bones,meshes,textures:textures.size};result=result.filter(x=>x.entry!==entry);result.push(r);console.log(JSON.stringify(r));
}catch(e){const r={ok:false,id:record.id,entry,error:String(e)};result.push(r);console.log(JSON.stringify(r));}
await fs.writeFile(dir+'/fbx-converted.json',JSON.stringify(result,null,2));
}
}console.log(JSON.stringify({completed:true,converted:result.filter(x=>x.ok).length,failed:result.filter(x=>!x.ok).length}));