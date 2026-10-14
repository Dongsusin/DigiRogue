// Source animations only: no pose generation or authored fallback in this selector.
export const NATIVE_MODEL_CLIP_PATTERNS = Object.freeze({
 idle: [/(?:^|_)bn01(?:_rd)?$/i,/^idle$/i,/^stand$/i,/a0_base_fa0_ul$/i],
 attack01: [/(?:^|_)ba01(?:_rd)?$/i,/^attack_move$/i,/^attack(?:0?1)?$/i,/a0_atck_fa0_un$/i],
 attack02: [/(?:^|_)ba02(?:_rd)?$/i,/^attack0?2$/i,/a0_atck_fb0_un$/i],
 special01: [/(?:^|_)bs01(?:_rd)?$/i,/^skill1$/i,/^skill2_display$/i,/^skill2$/i,/^attack$/i,/a0_shot_fa0_un$/i],
 special02: [/(?:^|_)bs02(?:_rd)?$/i,/^skill3$/i],
 damage: [/(?:^|_)bd01(?:_rd)?$/i,/^hurt[0-9]?$/i,/^damage[0-9]?$/i,/a0_dmgs_fa0_un$/i],
 down: [/(?:^|_)bd03(?:_rd)?$/i,/^(die|death|dead|defeat|down)$/i,/a0_dmgx_fa0_un$/i],
 victory: [/(?:^|_)bv01(?:_rd)?$/i,/^win$/i],
 guard: [/(?:^|_)bg01(?:_rd)?$/i,/^guard$/i],
 move: [/(?:^|_)br01(?:_rd)?$/i,/^move2$/i,/^move$/i],
})
const tracks = clip => Array.isArray(clip.tracks) ? clip.tracks.length : Number(clip.tracks ?? clip.channels ?? 0)
export function selectNativeModelClips(clips) {
 const usable = clips.filter(clip => clip.duration > .05 && tracks(clip) > 0)
 return Object.fromEntries(Object.entries(NATIVE_MODEL_CLIP_PATTERNS).map(([role, patterns]) => {
  for (const pattern of patterns) {
   const candidates = usable.filter(clip => pattern.test(clip.name)).sort((a,b) => tracks(b)-tracks(a) || b.duration-a.duration)
   if (candidates.length) return [role,candidates[0]]
  }
  return [role,null]
 }))
}
export function nativeCombatMotionCoverage(clips) {
 const selected = selectNativeModelClips(clips)
 const roles = {idle:selected.idle,attack:selected.attack01??selected.attack02??selected.special01??selected.special02,damage:selected.damage,defeat:selected.down}
 const missing = Object.keys(roles).filter(role => !roles[role])
 return {complete:missing.length===0,missing,roles:Object.fromEntries(Object.entries(roles).map(([role,clip])=>[role,clip?{name:clip.name,duration:clip.duration,tracks:tracks(clip)}:null]))}
}
