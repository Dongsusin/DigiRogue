import {createRequire} from 'node:module';
const sharp=createRequire('C:/Users/pdwea/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('sharp');
import {decodeTexture,bakePrimitiveTexture} from './texture-bake.mjs';
export async function bakeNextOrderEyes(document,eyePNG){
 // Next Order stores four expression frames in a 2x2 sheet. UV1 spans one
 // whole frame, not the sheet. The importer has already flipped PNGs for glTF.
 const source=await decodeTexture(eyePNG),eye=await decodeTexture(await sharp(eyePNG).extract({left:0,top:source.h/2,width:source.w/2,height:source.h/2}).png().toBuffer()),reports=[];
 for(const mesh of document.getRoot().listMeshes())for(const pr of mesh.listPrimitives()){
 const material=pr.getMaterial(),uv1=pr.getAttribute('TEXCOORD_1');if(!uv1||!material?.getBaseColorTexture())continue;
 const base=await decodeTexture(material.getBaseColorTexture().getImage());
 const {texture,report}=await bakePrimitiveTexture(document,pr,{base,layers:[{image:eye,uv:uv1}],targetTexCoord:0,width:1024,height:1024,name:'baked-next-order-eyes'});
 material.setBaseColorTexture(texture);material.getBaseColorTextureInfo().setTexCoord(0);reports.push(report);
 }if(!reports.length)throw Error('Next Order eye atlas has no UV1 geometry');return reports;
}
