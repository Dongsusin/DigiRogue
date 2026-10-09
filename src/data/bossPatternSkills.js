import { FINAL_BOSS_PROFILES } from './finalBossProfiles.js'

// HP patterns use native or authored final-boss moves in the battle itself.
const signatures = Object.freeze({
  워그레이몬: ['가이아 포스'], 메탈그레이몬: ['기가 디스트로이어'], 메탈가루몬: ['코큐토스 브레스'],
  오메가몬: ['가루루 캐논'], '오메가몬[즈왈트]': ['가루루 캐논'], '오메가몬[즈왈트-D]': ['가루루 캐논'],
  릴리몬: ['꽃잎 포'], 로제몬: ['포비든 템테이션'], '로제몬[버스트]': ['아기샨 레브르'],
  엔젤우몬: ['홀리 애로우'], 홀리엔젤몬: ['헤븐즈 게이트'], 세라피몬: ['세븐 헤븐즈'], 오파니몬: ['에덴즈 자벨린'],
  마스테몬: ['카오스 디그레이드'], 파일드라몬: ['무법천지'],
  '황제드라몬[드래곤]': ['메가 데스'], '황제드라몬[파이터]': ['기가 데스'], '황제드라몬[팔라딘]': ['오메가 블레이드'],
  듀크몬: ['파이널 엘리시온'], '듀크몬[크림슨]': ['쿼 바디스'], 샤인그레이몬: ['글로리어스 버스트'],
  '샤인그레이몬[버스트]': ['코로나 블레이즈 소드'], '샤인그레이몬[루인]': ['코로나 블레이즈 소드'],
  디아블로몬: ['카타스트로피 캐논'], 파워드라몬: ['∞캐논'], 카오스드라몬: ['하이퍼 무한 캐논'],
  아포카리몬: ['다크니스 존'], '위그드라실 7D6': ['크리스털 레이'], 아마게몬: ['얼티메이트 플레어'],
  '루체몬[폴다운]': ['그랜드 크로스'], '루체몬[사탄]': ['퍼가토리얼 플레임', '퍼거토리얼 플레임'],
  알카디몬: ['도트 매트릭스'], '알카디몬[초궁극체]': ['갓 매트릭스'],
  바그라몬: ['아스트랄 스내처'], 데크스몬: ['프로세스 F'],
  벨페몬: ['이터널 나이트메어'], '벨페몬[레이지]': ['기프트 오브 다크니스'],
  청룡몬: ['창뢰'], 주작몬: ['홍염'], 황룡몬: ['태극'],
})
const finalProfiles = new Map(FINAL_BOSS_PROFILES.map(profile => [profile.id, profile]))

export function getBossPhaseSignature(unit, phaseIndex, getSkillData) {
  const profile = finalProfiles.get(unit.bossEncounter?.id)
  const finalSkills = profile?.cycles[Math.min(phaseIndex + 1, profile.cycles.length - 1)]
    .filter(move => move.skill.데미지 > 0).map(move => move.skill) ?? []
  const native = (unit.speciesData?.기술 ?? unit.skills ?? []).map(name => getSkillData(name, unit))
    .filter(skill => skill && skill.데미지 > 0 && !skill.효과)
  const choices = finalSkills.length ? finalSkills : native
  const preferred = choices.find(skill => signatures[unit.name]?.includes(skill.기술명))
  const ordered = preferred ? [preferred, ...choices.filter(skill => skill.기술명 !== preferred.기술명)] : choices
  const skill = ordered[phaseIndex % Math.max(1, ordered.length)]
  return skill ? { skill: { ...skill } } : null
}
