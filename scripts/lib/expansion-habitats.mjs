// Only the named expansion is replaced; unrelated inhabitants and map links are retained.
export function applyExpansionHabitats(maps, habitats) {
 const next=structuredClone(maps),names=new Set(Object.keys(habitats))
 for(const data of Object.values(next))for(const [band,pool]of Object.entries(data.등장디지몬??{}))
  data.등장디지몬[band]=pool.filter(name=>!names.has(name))
 for(const [name,h]of Object.entries(habitats)) {
  if(!h.maps.length||h.maps.some(map=>!next[map]))throw Error('Invalid habitat: '+name)
  if(h.bossOnly&&h.bands.length)throw Error('Boss-only species in ordinary pool: '+name)
  for(const map of h.maps)for(const band of h.bands) {
   const pool=next[map].등장디지몬[String(band)]
   if(!pool)throw Error('Missing encounter band '+map+':'+band)
   if(!pool.includes(name))pool.push(name)
  }
 }
 return next
}
