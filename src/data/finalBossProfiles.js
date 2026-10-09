// Lore supplies the identities and moves. Thresholds, cycles and counters are fan-game rules.
const reference = name => `https://digimon.net/reference_en/detail.php?directory_name=${name}`
const stats = (values, turns = 3) => ({ stats: values, turns })
const attack = (name, power, element, style, { physical = false, area = false, status, chance = 0, target } = {}) => ({
  skill: { 기술명: name, 데미지: power, 명중률: '100%', 분류: physical ? '물리형' : '특수형', 속성: element,
    전체공격: area, 상태이상: status ?? null, 상태이상확률: status ? `${chance}%` : null },
  visual: { style, area }, target,
})
const support = (name, effect, tell) => ({ skill: { 기술명: name, 데미지: 0, 명중률: '100%', 분류: '보조형', 속성: '무',
  전체공격: false, 효과: effect }, tell })
const charge = (name, stat, tell) => support(name, { kind: 'stat-modifier', targetSide: 'ally', scope: 'self',
  statKey: stat, multiplier: 1.25, turns: 2 }, tell)
const guard = (name, kind, tell) => support(name, { kind: 'guard', guard: kind, turns: 2, targetSide: 'ally', scope: 'self' }, tell)
const debuff = (name, stat) => support(name, { kind: 'stat-modifier', targetSide: 'enemy', scope: 'all', statKey: stat, multiplier: .85, turns: 2 })
const phase = (atHp, label, effect, form = null) => ({ atHp, label, effect, form, speech: `${label}!` })
const final = (id, name, title, line, source, phases, cycles, extra = {}) => ({
  id, kind: 'final', name, title, emblem: '최종 보스', minStage: 200, maxStage: 200,
  themes: [], line, source, speech: `${name}이(가) 디지털 월드의 마지막 길을 가로막는다.`,
  phases, cycles, rules: [], ...extra,
})

export const FINAL_BOSS_PROFILES = Object.freeze([
  final('apocalymon-final', '아포카리몬', '종말의 어둠', ['아포카리몬'], reference('apoclymon'), [
    phase(.65, '네거티브 에너지 집약', stats({ specialAttack: 1.15 })),
    phase(.3, '끝없는 다크니스 존', { ...stats({ specialAttack: 1.25, defense: .85 }), stopRegeneration: true }),
  ], [[
    attack('암흑의 균열', 90, '어둠', 'orb'),
    charge('소멸 에너지 집약', 'specialAttack', '어둠이 팽창한다. 다음 행동에서 다크니스 존!'),
    attack('다크니스 존', 115, '어둠', 'ring', { area: true }),
    debuff('허무의 잔향', 'specialAttack'),
  ]]),
  final('yggdrasil-final', '위그드라실 7D6', '디지털 월드의 심판', ['위그드라실 7D6'],
    'https://models.spriters-resource.com/mobile/digimonlinks/asset/304092/', [
      phase(.6, '관리 프로그램 재구축', { clearStatus: true, healRatio: .08 }),
      phase(.3, '최종 삭제 명령', stats({ specialAttack: 1.25, specialDefense: .85 })),
    ], [[
      attack('크리스털 레이', 105, '빛', 'beam'), guard('수정 방벽', 'physical'),
      attack('크리스털 파동', 100, '빛', 'ring', { area: true }),
      charge('삭제 연산', 'specialAttack', '수정이 빛난다. 다음 행동에서 크리스털 레이!'),
    ]], { rules: [
      { id: 'physical-adapt', label: '물리 데이터 분석', condition: { kind: 'hits', category: '물리형', count: 2 }, effect: { guards: { physical: 2 } } },
      { id: 'special-adapt', label: '특수 데이터 분석', condition: { kind: 'hits', category: '특수형', count: 2 }, effect: { guards: { special: 2 } } },
    ] }),
  final('armageddemon-final', '아마게몬', '초고속 증식의 종착점', ['아마게몬'], reference('armagemon'), [
    phase(.6, '증식체 융합', stats({ attack: 1.1, specialAttack: 1.1 })),
    phase(.25, '멸망 포격', stats({ specialAttack: 1.25, defense: .85 })),
  ], [[
    attack('블랙 레인', 95, '어둠', 'missile', { area: true }),
    attack('얼티메이트 플레어', 115, '화염', 'beam'),
    charge('초고속 증식', 'specialAttack', '입에 에너지가 모인다. 다음 행동에서 얼티메이트 플레어!'),
    attack('얼티메이트 플레어', 125, '화염', 'beam'),
  ]], { companion: '쿠라몬', brood: true }),
  final('lucemon-final', '루체몬', '마지막 봉인 · 타락한 빛', ['루체몬[폴다운]', '루체몬[사탄]'], reference('lucemonsatanmode'), [
    phase(.6, '사탄 모드 출현', { clearStatus: true }, '루체몬[사탄]'),
    phase(.25, '게헤나 개방', stats({ specialAttack: 1.2, defense: .85 })),
  ], [[
    attack('파라다이스 로스트', 110, '빛', 'rush', { physical: true }),
    charge('타락한 계시', 'specialAttack', '빛과 어둠이 모인다. 다음 행동에서 그랜드 크로스!'),
    attack('그랜드 크로스', 110, '빛', 'ring', { area: true }),
  ], [guard('게헤나의 봉인', 'special'),
    charge('일곱 왕관 집약', 'specialAttack', '왕관이 빛난다. 다음 행동에서 퍼거토리얼 플레임!'),
    attack('퍼거토리얼 플레임', 115, '어둠', 'flame', { area: true }),
    attack('디바인 어톤먼트', 110, '어둠', 'orb'),
  ]]),
  final('arcadiamon-final', '알카디몬', '흡수와 파괴의 진화', ['알카디몬', '알카디몬[초궁극체]'], reference('arkadimon'), [
    phase(.55, '초궁극체 각성', { clearStatus: true }, '알카디몬[초궁극체]'),
    phase(.25, '파괴 데이터 해방', stats({ specialAttack: 1.2, defense: .85 })),
  ], [[
    attack('소울 앱소브션', 100, '어둠', 'orb'),
    charge('진화 데이터 흡수', 'specialAttack', '흡수한 데이터가 응축된다. 다음 행동에서 도트 매트릭스!'),
    attack('도트 매트릭스', 120, '어둠', 'beam'),
  ], [attack('소울 앱소브션', 105, '어둠', 'orb'),
    charge('파괴 데이터 집약', 'specialAttack', '공간에 균열이 열린다. 다음 행동에서 갓 매트릭스!'),
    attack('갓 매트릭스', 115, '어둠', 'beam', { area: true }),
  ]], { drainSkill: '소울 앱소브션' }),
  final('zwart-d-final', '오메가몬 즈왈트 D', '부서진 성기사의 폭주', ['오메가몬[즈왈트-D]'], reference('omegamonzwart_d'), [
    phase(.5, '검은 의지 폭주', stats({ attack: 1.2, speed: 1.2, specialDefense: .85 })),
    phase(.2, '파괴자 최후의 돌격', stats({ attack: 1.3, defense: .8 })),
  ], [[
    attack('그레이 소드', 110, '어둠', 'slash', { physical: true, target: 'weakest' }),
    charge('검은 포구의 열기', 'specialAttack', '포구가 열린다. 다음 행동에서 가루루 캐논!'),
    attack('가루루 캐논', 120, '어둠', 'beam', { target: 'weakest' }),
    attack('그레이 소드', 110, '어둠', 'slash', { physical: true, target: 'weakest' }),
  ]]),
  final('bagramon-final', '바그라몬', '죽음의 현자', ['바그라몬'], reference('bagramon'), [
    phase(.6, '의안의 전지', { clearStatus: true, ...stats({ specialDefense: 1.15 }) }),
    phase(.25, '영혼의 지배자', stats({ specialAttack: 1.25, defense: .85 })),
  ], [[
    debuff('인비저블 스네이크 아이즈', 'attack'),
    charge('영혼을 잡는 오른팔', 'specialAttack', '거대한 오른팔이 움직인다. 다음 행동에서 아스트랄 스내처!'),
    attack('아스트랄 스내처', 110, '어둠', 'orb', { status: '착란', chance: 60, target: 'strongest' }),
    guard('폭군의 방벽', 'physical'),
  ]]),
  final('dexmon-final', '데크스몬', '데이터 삭제 프로그램', ['데크스몬'], reference('death-x-mon'), [
    phase(.55, '프로세스 재시동', { clearStatus: true, ...stats({ defense: 1.15 }) }),
    phase(.25, '프로세스 F 최종 실행', { ...stats({ specialAttack: 1.25, defense: .8 }), stopRegeneration: true }),
  ], [[
    debuff('프로세스 0', 'specialDefense'),
    attack('데이터 분해', 105, '어둠', 'claw', { physical: true }),
    charge('삭제 코드 집약', 'specialAttack', '삭제 코드가 가득 찬다. 다음 행동에서 프로세스 F!'),
    attack('프로세스 F', 115, '어둠', 'ring', { area: true }),
  ]]),
])

export const FINAL_BOSS_MOVE_VISUALS = Object.freeze(Object.fromEntries(FINAL_BOSS_PROFILES.flatMap(profile =>
  profile.cycles.flat().filter(move => move.visual).map(move => [move.skill.기술명, move.visual]))))
