
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import * as THREE from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
const root='C:/Users/pdwea/Develop/digirouge',req=createRequire(root+'/.cache/asset-tools/package.json');
const {unzipSync}=req('fflate');
globalThis.window=globalThis;
THREE.Object3D.prototype.bind ??= function() {};
THREE.TextureLoader.prototype.load=function(url,onLoad){const t=new THREE.Texture();t.name=String(url);t.userData.originalUrl=String(url);if(onLoad)queueMicrotask(()=>onLoad(t));return t;};
const zip=unzipSync(await fs.readFile(process.argv[2]));
console.log(JSON.stringify({files:Object.keys(zip).filter(n=>/\.(fbx|dae|obj|nif|kf)$/i.test(n))}));
for(const [entry,buffer]of Object.entries(zip).filter(([n])=>/\.fbx$/i.test(n))){
 try{
  const o=new FBXLoader().parse(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'');
  let bones=0,meshes=0,skinned=0;o.traverse(x=>{bones+=x.isBone?1:0;meshes+=x.isMesh?1:0;skinned+=x.isSkinnedMesh?1:0;});
  const materials=[];o.traverse(n=>{if(n.isMesh)for(const m of [n.material].flat())materials.push({mesh:n.name,material:m.name,map:m.map?.name,original:m.map?.userData.originalUrl})});console.log(JSON.stringify({entry,bones,meshes,skinned,materials,animations:o.animations.map(a=>({name:a.name,duration:a.duration,tracks:a.tracks.length}))}));
 }catch(e){console.log(JSON.stringify({entry,error:String(e)}));}
}
