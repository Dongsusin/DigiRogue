import { DIGIMON_STAGE_DATA } from '../data/digimonRoster.js'
import { getDigimonTrainingRank } from '../data/digimonStages.js'
import { resolveAttackPresentation } from '../three/attackPresentation.js'

const roster = new Map(Object.entries(DIGIMON_STAGE_DATA)
  .flatMap(([stage, rows]) => rows.map(row => [row.이름, { size: row.크기 || 2, stage: getDigimonTrainingRank(row, stage) }])))
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

// The actual weapon/delivery selects the instrument, never the damage-stat category.
export const STYLE_INSTRUMENTS = Object.freeze({
  punch: 'body', claw: 'claw', slash: 'blade', spear: 'blade', hammer: 'heavy', bite: 'bite',
  tail: 'body', wingStrike: 'wind', rush: 'heavy', spin: 'wind', drill: 'drill', whip: 'vine',
  native: 'spectral', hellfire: 'cannon', fireball: 'ember', fist: 'body', giantOrb: 'nova', bullet: 'gun',
  missile: 'rocket', arrow: 'bow', blade: 'blade', needle: 'needle', feather: 'wind',
  orb: 'energy', rock: 'stone', metalBall: 'metal', bat: 'spectral', bird: 'wind',
  meteor: 'stone', bomb: 'explosive', seed: 'plant', leaf: 'plant', bubble: 'water',
  air: 'wind', web: 'silk', sound: 'voice', heart: 'charm', crystal: 'crystal', fish: 'water',
  gear: 'metal', vortex: 'wind', wave: 'water', breath: 'flame', iceBreath: 'frost',
  flame: 'flame', beam: 'laser', lightning: 'electric', ring: 'energy', portal: 'spectral',
  summon: 'spectral', mist: 'spectral', spike: 'stone',
})

// These accents belong to a particular signature, not every skill learned by that species.
export const SIGNATURE_SOUNDS = {
  아구몬: { '베이비 플레임': { instrument: 'ember', pitch: 1.18, character: 'dragon' } },
  그레이몬: { '메가파이어': { instrument: 'flame', pitch: .83, character: 'dragon' } },
  워그레이몬: { '가이아 포스': { instrument: 'nova', pitch: .76, weight: 1.45 }, '브레이브 토네이도': { instrument: 'wind', pitch: .78, weight: 1.3 } },
  '베르제브몬[X항체]': { '세븐스 ･ 풀 ･ 클러스터': { instrument: 'cannon', pitch: .7, weight: 1.4, character: 'machine' } },
  베리얼묘티스몬: { '팬더모디엄 플레임': { instrument: 'flame', pitch: .68, weight: 1.45 } },
  블랙워그레이몬: { '다크 가이아 포스': { instrument: 'nova', pitch: .68, weight: 1.5 } },
  베르제브몬: { '더블 임팩트': { instrument: 'shotgun', pitch: .84, character: 'machine' } },
  가르고몬: { '속사총': { instrument: 'machinegun', pitch: 1.12, character: 'machine' } },
  세인트가르고몬: { '화력발사': { instrument: 'machinegun', pitch: .78, character: 'machine' } },
  라이즈그레이몬: { '삼연발 레이저포': { instrument: 'cannon', pitch: .94, character: 'machine' } },
  래피드몬: { '래비드 파이어': { instrument: 'rocket', pitch: 1.12, character: 'machine' } },
  메탈가루몬: { '그레이스 크로스 프리저': { instrument: 'rocket', pitch: .86, character: 'machine' } },
  오메가몬: { '가루루 캐논': { instrument: 'cannon', pitch: .72, character: 'machine' }, '그레이 소드': { instrument: 'blade', pitch: .82, weight: 1.3 } },
  엔젤우몬: { '천국의 화살': { instrument: 'holyBow', pitch: 1.12, character: 'sacred' } },
  릴리몬: { '꽃잎 포': { instrument: 'petalCannon', pitch: 1.16, character: 'plant' } },
  디지타몬: { '나이트메어 신드롬': { instrument: 'spectral', pitch: .8 } },
}

export function speciesSoundIdentity(name = '', size) {
  const info = roster.get(name) || { stage: 2, size: 2 }
  const bodySize = Number(size) || info.size
  const pitch = clamp(1.3 - info.stage * .055 - (bodySize - 1) * .065, .62, 1.35)
  const character = /메탈|머신|안드로|가르고|래피드|메가로그라우|사이버|탱크|메카|베르제브/.test(name) ? 'machine'
    : /엔젤|엔젤우|세라피|오파니|홀리|켈비/.test(name) ? 'sacred'
      : /릴리|팔몬|로제|로터스|우드|베지|플로라|블로썸|릴라/.test(name) ? 'plant'
        : /시드라|쉬라|가와파|고마|샤코|마린|피치/.test(name) ? 'aquatic'
          : /캅테리|스팅|쿠가|텐타|플라이|웜몬/.test(name) ? 'insect'
            : /그레이|티라노|길몬|그라우|드라몬|드래곤/.test(name) ? 'dragon'
              : /가루|가오|레오|가트|레나|큐비|베어/.test(name) ? 'beast' : 'digital'
  return { pitch, weight: clamp(.7 + bodySize * .12 + info.stage * .05, .8, 1.55), character }
}

export function resolveAttackSound(event = {}) {
  const plan = event.presentation || resolveAttackPresentation(event)
  const species = event.attackerSpecies || plan.species || ''
  const identity = speciesSoundIdentity(species, event.attackerSize)
  return {
    instrument: STYLE_INSTRUMENTS[plan.styleId] || 'energy',
    ...identity, ...SIGNATURE_SOUNDS[species]?.[event.skillName || plan.skillName],
    species, skillName: event.skillName || plan.skillName, plan,
    element: plan.palette?.kind || 'neutral',
  }
}
