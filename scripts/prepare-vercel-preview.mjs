import fs from 'node:fs/promises'
import path from 'node:path'
const root=path.dirname(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1')))
const origin=process.argv[2]
if (!origin || !/^https:\/\/[a-z0-9-]+\.web\.app$/.test(origin)) throw new Error('Supply the Firebase preview HTTPS origin')
// A path capture preserves UTF-8 folder names without fixed-prefix matching.
const rewrites=[{source:'/:path*',destination:origin+'/:path*'}]
const config={version:2,framework:'vite',buildCommand:'npm run build',installCommand:'npm ci --no-audit --no-fund',outputDirectory:'dist',rewrites,headers:[{source:'/assets/(.*)',headers:[{key:'Cache-Control',value:'public,max-age=31536000,immutable'}]},{source:'/',headers:[{key:'Cache-Control',value:'no-cache'}]}]}
await fs.writeFile(root+'/vercel.json',JSON.stringify(config,null,2)+'\n')
console.log(JSON.stringify({passed:true,assetOrigin:origin,routes:rewrites.length}))
