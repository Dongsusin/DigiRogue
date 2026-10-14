import fs from 'node:fs/promises'
import habitats from '../../src/data/expansionHabitats.json' with {type:'json'}
import {applyExpansionHabitats} from '../lib/expansion-habitats.mjs'
const file=new URL('../../data/map.json',import.meta.url),raw=await fs.readFile(file,'utf8'),original=JSON.parse(raw)
const next=applyExpansionHabitats(original,habitats),same=JSON.stringify(original)===JSON.stringify(next)
if(process.argv.includes('--check')){if(!same)throw Error('Map placements do not match authored habitats')}
else await fs.writeFile(file,(JSON.stringify(next,null,2)+'\n').replace(/\n/g,raw.includes('\r\n')?'\r\n':'\n'))
console.log(JSON.stringify({exitCode:0,maps:Object.keys(next).length,species:Object.keys(habitats).length,bossOnly:Object.values(habitats).filter(h=>h.bossOnly).length,checked:process.argv.includes('--check')}))
