import {createRequire} from 'node:module'
const sharp=createRequire('C:/Users/pdwea/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('sharp')

// FBX has no standard LOD selection: export only the full-detail sibling.
// Retain bones/nodes used by animations; detach just the duplicate render geometry.
export async function repairImportedFaceLayers(document){
 const nodes=document.getRoot().listNodes(),fullNames=new Set(nodes.filter(n=>n.getMesh()).map(n=>n.getName().toLowerCase())),removedLods=[],cutoutEyes=[]
 for(const node of nodes){
  const name=node.getName(),base=name.replace(/[_-]?lod[_-]?[1-9]\d*$/i,'')
  if(node.getMesh()&&base!==name&&fullNames.has(base.toLowerCase())){removedLods.push(name);node.setMesh(null);node.setSkin(null)}
 }
 const used=new Set(nodes.flatMap(n=>n.getMesh()?.listPrimitives().map(p=>p.getMaterial())??[]))
 for(const material of used){
  const texture=material?.getBaseColorTexture()
  if(!texture||!/(?:^|[_-])eye(?:[_.-]|$)/i.test(texture.getName())||material.getAlphaMode()!=='OPAQUE')continue
  const stats=await sharp(texture.getImage()).stats()
  // Packed masks in body alpha and wholly opaque eyes are deliberately unchanged.
  if(stats.isOpaque||stats.channels.length!==4||stats.channels[3].min!==0||stats.channels[3].max<200)continue
  material.setAlphaMode('MASK').setAlphaCutoff(.2)
  cutoutEyes.push({material:material.getName(),texture:texture.getName()})
 }
 return {removedLods,cutoutEyes}
}
