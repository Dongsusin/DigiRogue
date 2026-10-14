import {decodeTexture,uvTriangleStats,needsFaceAtlas,bakePrimitiveTexture} from './texture-bake.mjs';
export async function bakeFaceOverlays(document){
 const root=document.getRoot(),textures=root.listTextures(),decoded=new Map(),reports=[];
 const read=async name=>{const texture=textures.find(t=>t.getName()===name);if(!texture)return null;if(!decoded.has(texture))decoded.set(texture,decodeTexture(texture.getImage()));return decoded.get(texture);};
 for(const mesh of root.listMeshes())for(const pr of [...mesh.listPrimitives()]){
 const material=pr.getMaterial(),meta=material?.getExtras()?.dsts,slots=meta?.texture_slots;
 // Additive reflection domes are not opaque eyeballs.
 if(slots?.InnerGrowAValue){mesh.removePrimitive(pr);continue;}if(!slots)continue;
 const bName=Object.values(slots).find(n=>/b01$/.test(n)),pName=Object.values(slots).find(n=>/p01$|01p$/.test(n));
 const uv0=pr.getAttribute('TEXCOORD_0'),uv1=pr.getAttribute('TEXCOORD_1'),uv2=pr.getAttribute('TEXCOORD_2');if(!bName||!uv0||!uv2)continue;
 const base=await read(slots.DiffuseColor??meta.model_id+'a01'),face=await read(bName),iris=await read(pName);if(!base||!face)throw Error('Missing face texture '+meta.model_id);
 const width=Math.min(1024,face.w),height=Math.min(1024,face.h),stats=uvTriangleStats(pr,'TEXCOORD_2',width,height),atlas=needsFaceAtlas(stats);
 const layers=[];if(iris&&uv1)layers.push({image:iris,uv:uv1});layers.push({image:face,uv:uv2});
 const {texture,report}=await bakePrimitiveTexture(document,pr,{base,layers,targetTexCoord:2,atlas,width,height,name:'baked-face-'+meta.model_id+'-'+reports.length});
 const baked=material.clone();baked.setBaseColorTexture(texture);baked.getBaseColorTextureInfo().setTexCoord(2);baked.setNormalTexture(null);baked.setExtras({});pr.setMaterial(baked);reports.push({modelId:meta.model_id,...report,sourceUV:stats});
 }return reports;
}
export function repairDstsEyeShade(material){
 const extras=material.getExtras();if(material.getName()!=='eye_s'||extras?.dsts_render?.alpha_mode!=='BLEND')return false;
 const color=extras?.dsts?.uniforms?.DiffuseAlpha;if(!Array.isArray(color)||color.length!==4)throw Error('Missing eye shade uniform');
 material.setBaseColorTexture(null).setBaseColorFactor(color).setAlphaMode('BLEND').setDoubleSided(false);return true;
}
