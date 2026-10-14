// Offline only: flatten source-game face shaders without changing skeletons or clips.
import {createRequire} from 'node:module';
const sharp=createRequire('C:/Users/pdwea/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('sharp');
export async function decodeTexture(bytes){const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});return{data,w:info.width,h:info.height};}
export function sampleRGBA(im,u,v,premultiply=true){
 if(!im)return[0,0,0,0];
 const x=((u%1+1)%1)*im.w-.5,y=((v%1+1)%1)*im.h-.5,x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0;
 const sum=[0,0,0,0];for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
 const i=((((y0+dy)%im.h+im.h)%im.h)*im.w+((x0+dx)%im.w+im.w)%im.w)*4,weight=(dx?fx:1-fx)*(dy?fy:1-fy),alpha=im.data[i+3]/255;
 for(let c=0;c<3;c++)sum[c]+=im.data[i+c]*(premultiply?alpha:1)*weight;sum[3]+=alpha*weight;
 }return[...sum.slice(0,3).map(c=>premultiply?(sum[3]?c/sum[3]:0):c),sum[3]*255];
}
export function uvTriangleStats(primitive,semantic,width=1024,height=1024){
 const uv=primitive.getAttribute(semantic);if(!uv)return null;const idx=primitive.getIndices(),count=idx?.getCount()??uv.getCount();let degenerate=0,subpixel=0;
 for(let k=0;k<count;k+=3){const [a,b,c]=[0,1,2].map(o=>uv.getElement(idx?idx.getScalar(k+o):k+o,[]));const area=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]));if(area<1e-10)degenerate++;if(area*width*height<4)subpixel++;}
 return{triangles:count/3,degenerate,subpixel};
}
export function needsFaceAtlas(stats){return!!stats&&(stats.degenerate>0||stats.subpixel>Math.max(4,stats.triangles*.1));}
export async function bakePrimitiveTexture(document,pr,{base,layers,targetTexCoord=0,atlas=false,width=1024,height=1024,name='baked-face'}){
 const uv0=pr.getAttribute('TEXCOORD_0'),target=pr.getAttribute('TEXCOORD_'+targetTexCoord),idx=pr.getIndices(),count=idx?.getCount()??uv0.getCount(),ids=Array.from({length:count},(_,i)=>idx?idx.getScalar(i):i),triangles=count/3;
 const grid=Math.ceil(Math.sqrt(triangles)),cell=Math.floor(Math.min(width,height)/grid),margin=Math.min(6,cell*.15),atlasUV=atlas?new Float32Array(count*2):null;
 const out=Buffer.alloc(width*height*4),covered=new Uint8Array(width*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++){
 const i=(y*width+x)*4,b=targetTexCoord===0&&!atlas?sampleRGBA(base,(x+.5)/width,(y+.5)/height,false):[0,0,0,255];for(let c=0;c<3;c++)out[i+c]=Math.round(b[c]);out[i+3]=255;}
 let rasterized=0,skipped=0;for(let k=0;k<count;k+=3){const tri=ids.slice(k,k+3),source=tri.map(i=>uv0.getElement(i,[])),sources=layers.map(l=>tri.map(i=>l.uv.getElement(i,[])));
 let dst;if(atlas){const x=(k/3%grid)*cell+margin,y=Math.floor(k/3/grid)*cell+margin,side=cell-2*margin;dst=[[x/width,y/height],[(x+side)/width,y/height],[x/width,(y+side)/height]];dst.forEach((p,i)=>atlasUV.set(p,(k+i)*2));}else dst=tri.map(i=>target.getElement(i,[]));
 const [A,B,C]=dst,det=(B[1]-C[1])*(A[0]-C[0])+(C[0]-B[0])*(A[1]-C[1]);if(Math.abs(det)<1e-10){skipped++;continue;}rasterized++;
 const x0=Math.max(0,Math.floor(Math.min(...dst.map(v=>v[0]))*width)),x1=Math.min(width-1,Math.ceil(Math.max(...dst.map(v=>v[0]))*width)),y0=Math.max(0,Math.floor(Math.min(...dst.map(v=>v[1]))*height)),y1=Math.min(height-1,Math.ceil(Math.max(...dst.map(v=>v[1]))*height));
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const X=(x+.5)/width,Y=(y+.5)/height,t0=((B[1]-C[1])*(X-C[0])+(C[0]-B[0])*(Y-C[1]))/det,t1=((C[1]-A[1])*(X-C[0])+(A[0]-C[0])*(Y-C[1]))/det,t=[t0,t1,1-t0-t1];if(Math.min(...t)<-1e-7)continue;
 const interp=(coords,j)=>coords.reduce((s,q,i)=>s+q[j]*t[i],0),color=sampleRGBA(base,interp(source,0),interp(source,1),false);for(let l=0;l<layers.length;l++){const rgba=sampleRGBA(layers[l].image,interp(sources[l],0),interp(sources[l],1)),alpha=rgba[3]/255;for(let c=0;c<3;c++)color[c]=color[c]*(1-alpha)+rgba[c]*alpha;}
 const pixel=y*width+x;for(let c=0;c<3;c++)out[pixel*4+c]=Math.round(color[c]);covered[pixel]=1;}}
 // Pad atlas islands before mipmapping. Black empty texels must never bleed into eyelids.
 if(atlas||targetTexCoord!==0){let frontier=[];for(let i=0;i<covered.length;i++)if(covered[i])frontier.push(i);for(let pass=0;pass<6;pass++){const next=[];for(const i of frontier){const x=i%width,y=Math.floor(i/width);for(const n of [x>0?i-1:-1,x+1<width?i+1:-1,y>0?i-width:-1,y+1<height?i+width:-1])if(n>=0&&!covered[n]){covered[n]=1;out.copy(out,n*4,i*4,i*4+4);next.push(n);}}frontier=next;}}
 if(atlas){const remap=accessor=>{const source=accessor.getArray(),size=accessor.getElementSize(),arr=new source.constructor(count*size);for(let i=0;i<count;i++)for(let c=0;c<size;c++)arr[i*size+c]=source[ids[i]*size+c];return accessor.clone().setArray(arr);};for(const sem of pr.listSemantics())pr.setAttribute(sem,remap(pr.getAttribute(sem)));for(const morph of pr.listTargets())for(const sem of morph.listSemantics())morph.setAttribute(sem,remap(morph.getAttribute(sem)));pr.setIndices(null);pr.setAttribute('TEXCOORD_'+targetTexCoord,document.createAccessor(name+'-uv').setType('VEC2').setArray(atlasUV).setBuffer(uv0.getBuffer()));}
 const texture=document.createTexture(name).setImage(await sharp(out,{raw:{width,height,channels:4}}).png().toBuffer()).setMimeType('image/png');
 return{texture,report:{atlas,targetTexCoord,triangles,rasterized,skipped,width,height}};
}
