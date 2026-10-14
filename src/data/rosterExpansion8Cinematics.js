// Original procedural direction; native model motions remain unchanged.
const shot=(template,palette,kind,variant,extra={})=>({template,palette,motif:{kind,variant},sourceSpin:0,flashScale:0,effectFocus:true,...extra})
const ice=['#65ccf2','#e7faff','#4e78b0'],dark=['#9276bc','#ded0ef','#3b334e'],fire=['#e36c41','#ffe4b1','#6d314b'],holy=['#ddb65b','#f2eedc','#729bab']
export const ROSTER_8_EVOLUTION_SIGNATURES=Object.freeze({
 '스노우아구몬':shot('adventure',ice,'frost','snowfall',{backdrop:'prism'}),
 '에렉몬(보라)':shot('adventure',dark,'thunder','tail',{backdrop:'celestial'}),
 '폭탄모야몬':shot('adventure',fire,'target','bomb',{backdrop:'grid'}),
 '요우코몬':shot('dark',fire,'soul','fox',{backdrop:'void'}),
 '도우몬':shot('dark',dark,'relic','talisman',{backdrop:'cathedral'}),
 '블랙버드라몬':shot('dark',dark,'jet','wings',{backdrop:'void'}),
 '샤우트몬[스타소드]':shot('xros',holy,'blade','star',{backdrop:'blueprint',sourcePaletteByName:{샤우트몬:fire,스타몬즈:holy}}),
 '크레니엄몬[기승]':shot('jogress',holy,'shield','mounted',{backdrop:'helix',sourcePaletteByName:{크레니엄몬:holy,안바르몬:ice}}),
 '타이타몬[기승]':shot('jogress',dark,'soul','mounted',{backdrop:'helix',sourcePaletteByName:{타이타몬:dark,스컬벌키몬:['#b2a585','#eae0c2','#59536d']}}),
})
