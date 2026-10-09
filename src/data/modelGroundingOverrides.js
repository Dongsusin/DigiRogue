// These shipped models use ears, arms, shields or unnamed joints for wings.
// Their rendered idle silhouettes were checked alongside the rig-name audit.
// Keep the existing contact point rather than forcing a flying pose onto soles.
export const MODEL_GROUNDING_OVERRIDES = Object.freeze({
  '파닥몬': 'winged',
  '츠카이몬': 'winged',
  '메일버드라몬': 'winged',
  '신드라몬': 'winged',
  '메이크랙몬': 'winged',
  '팔코몬': 'winged',
  '쟈자몬': 'winged',
  '메탈그레이몬[크로스워즈]': 'winged',
  '워그레이몬': 'winged',
  '워그레이몬[X항체]': 'winged',
  '블랙워그레이몬': 'winged',
  '블랙워그레이몬[X항체]': 'winged',
  '긴류우몬': 'airborne',
  '히샤류우몬': 'airborne',
  '토토몬': 'airborne',
  '미타마몬': 'airborne',
  '미라쥬가오가몬[버스트]': 'airborne',
})
