// Shape, delivery and anatomy are independent of the damage-stat category and element palette.
const contact = (shape, anchor = 'hand', movement = 'step') => ({ shape, anchor, delivery: 'contact', movement, travelMs: 0, size: .8, shots: 1 })
const shot = (shape, anchor = 'mouth', travelMs = 320, size = .6, shots = 1) => ({ shape, anchor, delivery: 'projectile', movement: 'stationary', travelMs, size, shots })
const beam = (shape, anchor = 'mouth', size = .6) => ({ ...shot(shape, anchor, 240, size), delivery: 'beam' })
export const ATTACK_STYLES = Object.freeze({
  punch: contact('punch'), claw: contact('claw'), slash: contact('slash', 'weapon'),
  spear: contact('spear', 'weapon'), hammer: contact('hammer', 'weapon'),
  bite: contact('bite', 'mouth'), tail: contact('slash', 'tail'), wingStrike: contact('claw', 'wings'),
  rush: contact('rush', 'body', 'dash'), spin: contact('vortex', 'body', 'dash'), drill: contact('drill', 'weapon', 'dash'),
  whip: { ...contact('vine', 'hand', 'stationary'), delivery: 'tether', travelMs: 240 },
  native: { ...contact('native', 'body', 'stationary'), delivery: 'native' },
  fireball: shot('fireball'), hellfire: shot('fireball', 'cannon', 360, 1.1), fist: shot('fist', 'hand', 300, .75), giantOrb: shot('orb', 'overhead', 420, 1.5),
  breath: beam('flame'), iceBreath: beam('frost'), flame: beam('flame', 'hands'),
  beam: beam('beam', 'hand'), lightning: beam('lightning', 'hand'),
  bullet: shot('bullet', 'hand', 170, .28, 3), missile: shot('missile', 'back', 420, .48, 3),
  arrow: shot('arrow', 'bow', 260, .5), blade: shot('blade', 'weapon', 280, .55),
  needle: shot('needle', 'body', 240, .3, 5), feather: shot('feather', 'wings', 320, .5, 4),
  orb: shot('orb', 'hand', 340, .65), rock: shot('rock', 'hand', 400, .55),
  metalBall: shot('metalBall', 'mouth', 320, .65), bat: shot('bat', 'hands', 420, .6, 5), bird: shot('bird', 'wings', 440, 1.2),
  meteor: shot('meteor', 'overhead', 480, .7, 3), bomb: shot('bomb', 'hand', 420, .55),
  seed: shot('seed', 'mouth', 320, .35, 3), leaf: shot('leaf', 'hands', 320, .38, 5),
  bubble: shot('bubble', 'mouth', 430, .42, 3), air: shot('air', 'mouth', 300, .65),
  web: shot('web', 'mouth', 380, .75), sound: shot('sound', 'mouth', 380, .8, 3),
  heart: shot('heart', 'mouth', 430, .5, 3), crystal: shot('crystal', 'hand', 320, .5, 3),
  fish: shot('fish', 'mouth', 430, .4, 5), gear: shot('gear', 'body', 320, .55),
  vortex: shot('vortex', 'body', 440, 1), wave: shot('wave', 'body', 460, 1.2),
  ring: { ...shot('ring', 'body', 300, 1), delivery: 'field' },
  portal: { ...shot('portal', 'hand', 450, 1.3), delivery: 'field' },
  summon: { ...shot('summon', 'hand', 400, 1), delivery: 'field' },
  mist: { ...shot('mist', 'hands', 420, 1), delivery: 'field' },
  spike: { ...shot('spike', 'body', 320, 1), delivery: 'field' },
})

// Used only for inherited/attachment skills without a species signature entry.
// It deliberately never reads physical/special damage categories.
export function inheritedAttackStyle(name = '') {
  const rules = [
    [/클로|네일|긁|할퀴/, 'claw'], [/소드|블레이드|슬래시|검|참|시저/, 'slash'],
    [/주먹|펀치|너클|백핸드|스트라이크|타격/, 'punch'], [/태클|러시|돌진|헤딩|들이받/, 'rush'],
    [/테일|꼬리/, 'tail'], [/바이트|물어|송곳니|부리/, 'bite'], [/드릴|보링/, 'drill'],
    [/해머|망치|묠니르|방망이/, 'hammer'], [/위프|아이비|덩굴/, 'whip'],
    [/미사일|로켓|토마호크|그레네이드|디스트로이어/, 'missile'],
    [/애로|화살/, 'arrow'], [/속사|총|발사|임팩트/, 'bullet'],
    [/캐논|레이저|레이\b|광선|블래스터|블래스트|스트림/, 'beam'],
    [/브레스|뿜기|플레임/, 'breath'], [/파이어|화염볼|불꽃|네이팜|플레어/, 'fireball'],
    [/썬더|번개|전격|전기|라이트닝/, 'lightning'], [/아이스|크리스탈|빙|더스트/, 'crystal'],
    [/버블|거품|샤본/, 'bubble'], [/웹|그물|스레드/, 'web'],
    [/음파|세레나데|외침|자장가|심포니/, 'sound'], [/키스|러브|하트/, 'heart'],
    [/니들|바늘|스팅/, 'needle'], [/메테오|유성|스콜/, 'meteor'], [/봄|폭탄|응가/, 'bomb'],
    [/윙|깃털/, 'feather'], [/토네이도|타이푼|템페스트|회오리|소용돌이/, 'vortex'],
    [/웨이브|파도|물결/, 'wave'], [/록|스톤|돌|드롭/, 'rock'], [/너츠|넛츠|체리/, 'seed'],
    [/독|포이즌|미스트|안개|꽃가루/, 'mist'], [/서몬|부르기|나이트메어/, 'summon'],
    [/차지|가드|업|다운|필드|힐|큐어|만다라|저주/, 'ring'],
  ]
  return rules.find(([pattern]) => pattern.test(name))?.[1] || 'orb'
}
