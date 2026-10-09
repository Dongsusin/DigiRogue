import { resolveAttackSound, speciesSoundIdentity } from './soundProfiles.js'

const tone = (from, to, duration, gain, extra = {}) => ({ kind: 'tone', from, to, duration, gain, wave: 'sine', ...extra })
const noise = (from, to, duration, gain, extra = {}) => ({ kind: 'noise', from, to, duration, gain, filter: 'lowpass', ...extra })
const bell = (frequency, duration = .4, gain = .13, offset = 0) => [
  tone(frequency, frequency * .995, duration, gain, { offset }),
  tone(frequency * 2.76, frequency * 2.75, duration * .55, gain * .18, { offset }),
]
const panFor = side => side === 'enemy' ? .32 : side === 'ally' ? -.32 : 0
const recipe = (layers, { pan = 0, gain = 1, label = '', ...rest } = {}) => ({
  layers, pan, gain, label, ...rest,
  duration: Math.max(0, ...layers.map(layer => (layer.offset || 0) + layer.duration)),
})

function characterCharge(profile, duration) {
  const p = profile.pitch
  switch (profile.character) {
    case 'machine': return [tone(92 * p, 180 * p, duration, .06, { wave: 'triangle', attack: .035, modRate: 31, modDepth: .4 }), noise(3100, 900, .035, .1)]
    case 'dragon': return [noise(340 * p, 650 * p, duration, .11, { filter: 'bandpass', q: 1, attack: .08, modRate: 43 * p, modDepth: .55 })]
    case 'beast': return [noise(250 * p, 500 * p, duration, .09, { filter: 'bandpass', q: 2, attack: .055, modRate: 32 * p, modDepth: .6 })]
    case 'plant': return [noise(2400, 4600, duration, .055, { filter: 'highpass', attack: .07 })]
    case 'aquatic': return [tone(160 * p, 420 * p, duration, .055, { modRate: 15, modDepth: .65, attack: .045 })]
    case 'insect': return [noise(4500, 1900, duration, .055, { filter: 'bandpass', modRate: 70, modDepth: .8 })]
    case 'sacred': return bell(530 * p, duration, .05)
    default: return [tone(120 * p, 240 * p, duration, .045, { wave: 'triangle', attack: .06 })]
  }
}

function launchLayers(instrument, travel) {
  switch (instrument) {
    case 'machinegun': return [noise(6500, 1300, .065, .45), tone(210, 68, .08, .28), noise(4200, 2200, .035, .16, { offset: .036, filter: 'highpass' })]
    case 'shotgun': return [noise(7200, 450, .18, .48), tone(150, 38, .2, .42), tone(78, 42, .16, .18), noise(2500, 600, .07, .16, { offset: .08 })]
    case 'gun': return [noise(4800, 750, .095, .38), tone(190, 57, .12, .32), ...bell(1450, .09, .035)]
    case 'rocket': return [noise(4200, 800, .085, .35), noise(850, 3600, travel, .19, { attack: .025, modRate: 28, modDepth: .25 }), tone(95, 190, travel, .13, { wave: 'triangle' })]
    case 'bow': case 'holyBow': return [tone(580, 180, .14, .26, { wave: 'triangle' }), noise(6500, 2500, travel, .13, { filter: 'highpass' }), ...(instrument === 'holyBow' ? bell(1046, .34, .12) : [])]
    case 'cannon': return [tone(135, 38, .36, .42), tone(270, 85, travel, .12, { wave: 'sawtooth', cutoff: 1800, modRate: 45, modDepth: .4 }), noise(2900, 650, .34, .3), ...bell(1800, .24, .035)]
    case 'laser': return [tone(460, 130, travel, .2, { wave: 'sawtooth', cutoff: 2100, attack: .018, modRate: 33, modDepth: .35 }), tone(110, 60, travel, .22), noise(4200, 900, travel, .1, { filter: 'bandpass', q: 1.5 })]
    case 'nova': return [tone(82, 32, travel + .1, .38), tone(164, 48, travel, .15, { wave: 'triangle' }), noise(680, 1800, travel, .3, { attack: .07, hold: .32 }), noise(5200, 900, .12, .13)]
    case 'ember': return [noise(2000, 450, travel, .31, { attack: .015, modRate: 37, modDepth: .25 }), tone(170, 60, .2, .24), noise(5100, 1500, .055, .15)]
    case 'flame': return [noise(1400, 650, travel + .08, .34, { attack: .035, hold: .48, modRate: 28, modDepth: .35 }), tone(105, 65, travel, .2, { wave: 'triangle' }), noise(4600, 1800, .14, .1)]
    case 'blade': return [noise(1100, 6800, .14, .22, { filter: 'bandpass', q: .7, attack: .025 }), ...bell(1700, .17, .08)]
    case 'claw': return [noise(2800, 600, .17, .25, { filter: 'bandpass', q: .8 }), noise(4400, 1000, .07, .12, { offset: .035 })]
    case 'bite': return [noise(800, 2200, .12, .22), tone(180, 70, .1, .17)]
    case 'body': return [noise(700, 2200, Math.max(.1, travel), .22, { attack: .028, filter: 'bandpass', q: .6 }), tone(180, 85, .11, .12)]
    case 'heavy': case 'stone': case 'explosive': return [noise(800, 2600, travel || .15, .25, { attack: .02 }), tone(100, 45, .2, .3), noise(3900, 900, .09, .1)]
    case 'metal': return [noise(2600, 650, .13, .22), ...bell(750, .26, .16), tone(110, 60, .18, .2)]
    case 'drill': return [tone(145, 260, travel || .24, .14, { wave: 'sawtooth', modRate: 47, modDepth: .5, cutoff: 2200 }), noise(1700, 3400, .18, .15)]
    case 'vine': return [noise(700, 5800, .13, .2, { attack: .02, filter: 'bandpass', q: .8 }), noise(6500, 1600, .038, .25, { offset: .085 })]
    case 'plant': case 'petalCannon': return [noise(2200, 5500, travel, .15, { filter: 'highpass', attack: .02 }), tone(instrument === 'plant' ? 500 : 220, 95, .12, .22), ...bell(760, .2, instrument === 'plant' ? .035 : .09)]
    case 'water': return [noise(1100, 4600, travel, .2, { attack: .045, filter: 'bandpass', q: .6 }), tone(550, 110, .13, .14), tone(730, 175, .16, .11, { offset: .05 })]
    case 'crystal': case 'frost': return [...bell(1250, travel, .18), ...bell(1780, travel * .8, .07, .025), noise(7600, 2800, travel, .14, { filter: 'highpass', attack: .025 })]
    case 'electric': return [noise(5400, 1700, travel, .21, { modRate: 65, modDepth: .85 }), tone(190, 82, travel, .12, { wave: 'sawtooth', modRate: 57, modDepth: .7, cutoff: 2800 })]
    case 'wind': return [noise(600, 3600, travel, .26, { attack: .04, hold: .25, filter: 'bandpass', q: .7 })]
    case 'silk': return [noise(4100, 900, travel, .12, { filter: 'highpass' }), tone(290, 100, .09, .08)]
    case 'needle': return [noise(7600, 2400, .07, .18, { filter: 'highpass' }), tone(2100, 750, .055, .08, { wave: 'triangle' })]
    case 'voice': return [tone(260, 180, travel, .14, { wave: 'sawtooth', cutoff: 900, modRate: 13, modDepth: .6 }), tone(520, 720, travel, .1, { modRate: 13, modDepth: .5 }), tone(1040, 1400, travel, .045)]
    case 'charm': return [...bell(660, travel, .12), ...bell(990, travel, .08, .06)]
    case 'spectral': return [noise(1500, 350, travel, .18, { filter: 'bandpass', attack: .07, q: 2 }), tone(85, 63, travel, .22, { modRate: 17, modDepth: .7 }), tone(510, 190, travel, .07, { wave: 'triangle' })]
    default: return [tone(260, 105, travel, .22, { wave: 'triangle' }), tone(520, 170, travel, .065), noise(3300, 700, travel, .16, { filter: 'bandpass', q: .8, attack: .025 })]
  }
}

function impactLayers(instrument, weight) {
  const body = tone(120 / weight, 36, .23, .35)
  if (['blade', 'metal', 'drill', 'claw'].includes(instrument)) return [body, noise(6200, 850, .12, .35), ...bell(instrument === 'claw' ? 1350 : 2200, .25, .14)]
  if (['body', 'bite', 'heavy'].includes(instrument)) return [body, noise(1500, 160, .16, .43), tone(310, 85, .065, .13)]
  if (['water', 'silk', 'plant', 'vine', 'petalCannon'].includes(instrument)) return [tone(170, 65, .17, .24), noise(5100, 1000, .23, .25), tone(560, 140, .12, .11, { offset: .05 })]
  if (['crystal', 'frost', 'holyBow', 'bow', 'charm'].includes(instrument)) return [body, ...bell(1550, .38, .18), noise(6500, 2600, .15, .2, { filter: 'highpass' })]
  if (['nova', 'rocket', 'explosive', 'cannon', 'stone'].includes(instrument)) return [tone(86 / weight, 29, .48, .43), noise(4600, 150, .43, .44), noise(2800, 450, .27, .14, { offset: .09 })]
  if (['gun', 'machinegun', 'shotgun', 'needle'].includes(instrument)) return [tone(175, 55, .13, .22), noise(3900, 430, .11, .33)]
  if (instrument === 'electric') return [body, noise(6300, 1000, .24, .26, { modRate: 72, modDepth: .85 }), tone(400, 80, .18, .1, { wave: 'sawtooth', cutoff: 1800 })]
  if (['flame', 'ember'].includes(instrument)) return [body, noise(2700, 180, .33, .36, { modRate: 35, modDepth: .3 }), noise(5600, 2400, .05, .12)]
  return [body, noise(2700, 350, .2, .28), tone(540, 130, .2, .09, { wave: 'triangle' })]
}

export function buildAttackSound(event, phase, shotIndex = 0) {
  const profile = resolveAttackSound(event)
  const { plan, instrument, pitch, weight } = profile
  const travel = Math.max(.12, plan.travelMs / 1000)
  let layers
  if (phase === 'charge') {
    const duration = Math.max(.07, Math.min(.9, plan.releaseMs / 1000 * .85))
    layers = characterCharge(profile, duration)
    if (['nova', 'cannon', 'laser', 'energy', 'spectral'].includes(instrument)) layers.push(
      tone(90 * pitch, 220 * pitch, duration, .12, { wave: 'triangle', attack: duration * .65, hold: .08 }),
      noise(280, 2300, duration, .06, { attack: duration * .7, filter: 'bandpass' }),
    )
  } else if (phase === 'launch') layers = launchLayers(instrument, travel)
  else if (phase === 'impact') layers = impactLayers(instrument, weight)
  else return recipe([])
  // Element is a quiet material accent, underneath the character's weapon/skill identity.
  if (phase === 'impact') {
    if (profile.element === 'electric' && instrument !== 'electric') layers.push(noise(4400, 950, .14, .055, { modRate: 63, modDepth: .8 }))
    else if (profile.element === 'ice' && !['crystal', 'frost', 'water'].includes(instrument)) layers.push(...bell(2100, .19, .04))
    else if (profile.element === 'light' && !['holyBow', 'charm'].includes(instrument)) layers.push(...bell(1320, .24, .055))
    else if (profile.element === 'dark') layers.push(tone(63, 39, .25, .08, { modRate: 17, modDepth: .4 }))
    else if (profile.element === 'fire' && !['ember', 'flame'].includes(instrument)) layers.push(noise(4800, 1400, .13, .06, { modRate: 41, modDepth: .65 }))
  }
  // Short envelopes accelerate with gameplay; frequencies do not, so 2x keeps the same voice.
  if (phase !== 'charge') layers = layers.map(layer => ({ ...layer,
    from: layer.from * pitch, to: layer.to * pitch,
    gain: layer.gain * (phase === 'launch' && plan.shots > 1 ? .8 : 1),
  }))
  return recipe(layers, {
    pan: panFor(phase === 'impact' ? event.targetSide : event.attackerSide),
    gain: phase === 'charge' ? .8 : .88,
    mix: 'attack',
    label: `${profile.species} · ${profile.skillName} · ${instrument} / ${phase}`,
    instrument, shotIndex, pitch,
  })
}

export function buildSituationSound(kind, { species = '', side, status = '', duration, ...options } = {}) {
  const { pitch } = speciesSoundIdentity(species)
  let layers = []
  const notes = (frequencies, step = .085, gain = .14) => frequencies.flatMap((f, i) => bell(f * pitch, .24, gain, i * step))
  switch (kind) {
    case 'ui-select': layers = [tone(820, 560, .045, .13), noise(4700, 1700, .018, .055)]; break
    case 'ui-back': layers = [tone(600, 330, .065, .1, { wave: 'triangle' })]; break
    case 'miss': layers = [noise(2200, 650, .22, .2, { filter: 'bandpass', attack: .025, q: .7 })]; break
    case 'block': layers = [tone(220, 165, .17, .17, { wave: 'triangle' }), ...bell(1050, .12, .05)]; break
    case 'recall': layers = [tone(780 * pitch, 150 * pitch, .38, .14, { wave: 'triangle', attack: .04 }), noise(4200, 600, .36, .1, { attack: .04 })]; break
    case 'send-out': layers = [tone(180 * pitch, 820 * pitch, .4, .12, { wave: 'triangle', attack: .06 }), ...notes([520, 780], .06, .08), noise(600, 3400, .32, .08, { attack: .04 })]; break
    case 'defeat': layers = [noise(1900, 180, .46, .16, { attack: .045, modRate: 26, modDepth: .55 }), tone(180 * pitch, 38 * pitch, .45, .15, { wave: 'triangle' })]; break
    case 'heal': case 'cure': case 'revive': layers = notes(kind === 'revive' ? [330, 495, 660, 990] : kind === 'cure' ? [780, 1040] : [440, 660, 880], .08, .12); break
    case 'buff': layers = [tone(220, 660, .25, .13, { wave: 'triangle', attack: .03 }), ...notes([660, 880], .075, .07)]; break
    case 'debuff': layers = [tone(500, 130, .3, .16, { wave: 'triangle', modRate: 18, modDepth: .35 })]; break
    case 'status':
      layers = /마비|감전/.test(status) ? [noise(4800, 950, .24, .18, { modRate: 56, modDepth: .9 })]
        : /수면|잠/.test(status) ? notes([650, 520, 390], .09, .065)
          : /빙결|얼음|동결/.test(status) ? [...bell(1700, .28, .12), noise(6800, 2700, .14, .1)]
            : /화상|불/.test(status) ? [noise(2800, 500, .25, .18, { modRate: 31, modDepth: .5 })]
              : [tone(190, 90, .28, .11, { modRate: 14, modDepth: .7 }), noise(1900, 700, .2, .08)]
      break
    case 'capture': layers = [noise(4200, 900, .28, .16, { attack: .025 }), tone(980, 320, .18, .12, { wave: 'triangle' })]; break
    case 'capture-bind': layers = [tone(240, 640, .3, .1, { wave: 'triangle', attack: .035 }), noise(1700, 4200, .25, .065)]; break
    case 'capture-pulse': layers = [tone(520, 780, .12, .09, { wave: 'sine' }), tone(130, 95, .13, .075)]; break
    case 'capture-success': layers = [tone(170, 65, .13, .17), ...notes([660, 880, 1320], .1, .12)]; break
    case 'capture-fail': layers = [noise(3100, 600, .13, .16), ...notes([440, 330], .1, .09)]; break
    case 'escape': layers = [noise(900, 4600, .3, .14, { filter: 'bandpass', attack: .02 }), tone(360, 720, .18, .08)]; break
    case 'item': layers = notes([780, 1040], .065, .09); break
    case 'encounter': layers = [tone(130, 65, .18, .12), ...notes([390, 520], .1, .075)]; break
    case 'boss': layers = [tone(72, 42, .65, .24, { attack: .05 }), tone(147, 98, .5, .09, { wave: 'triangle' }), noise(1700, 340, .4, .13)]; break
    case 'victory': layers = notes([392, 494, 587, 784], .085, .115); break
    case 'loss': layers = notes([294, 247, 196], .16, .11); break
    case 'level-up': layers = notes([660, 880, 1108, 1320], .06, .08); break
    case 'evolution-intro': layers = [tone(110, 165, .7, .1, { wave: 'triangle', attack: .2 }), ...notes([440, 660], .12, .06)]; break
    case 'evolution-charge': {
      const length = duration || 2.1
      layers = [tone(82, 330, length, .18, { wave: 'triangle', attack: length * .7, hold: .1, modRate: 10, modDepth: .3 }), noise(240, 2600, length, .12, { filter: 'bandpass', attack: length * .7 })]
      break
    }
    case 'evolution-transform': layers = [noise(5200, 400, 1.05, .23, { attack: .12 }), tone(110, 42, .65, .28), ...notes([440, 660, 880], .12, .11)]; break
    case 'evolution-reveal': layers = [tone(100 * pitch, 50 * pitch, .5, .15), ...notes([523, 784, 1046], .13, .1)]; break
    case 'evolution-complete': layers = notes([784, 1046], .12, .075); break
    default: break
  }
  return recipe(layers, { pan: panFor(side), gain: .85, label: kind, ...options })
}

// Auxiliary feedback follows the message actually being displayed, never the already
// calculated future state. Attack release/impact/KO sounds use structured events instead.
export function soundForBattleMessages(logs = []) {
  const text = logs.join('\n')
  if (/포획했다!/.test(text)) return { kind: 'capture-success' }
  if (/그물에서 빠져나왔다!/.test(text)) return { kind: 'capture-fail' }
  if (/무사히 도망쳤다!/.test(text)) return { kind: 'escape' }
  if (/도망칠 수 없었다!|공격이 통하지 않았다!|은\(는\) 실패했다!/.test(text)) return { kind: 'block' }
  if (/부활했다!|로 전투에 복귀했다!/.test(text)) return { kind: 'revive' }
  if (/상태이상이 해제됐다!|상태가 (자연스럽게 )?풀렸다|스테이터스 (하락|증가)가 해제됐다/.test(text)) return { kind: 'cure' }
  if (/HP가 [1-9]\d* 회복|HP를 [1-9]\d* 회복|완전히 회복됐다/.test(text)) return { kind: 'heal' }
  if (/% 증가!/.test(text)) return { kind: 'buff' }
  if (/% 감소!/.test(text)) return { kind: 'debuff' }
  if (/상태이상\([^)]+\)에 걸렸다|상태가 되었다|움직일 수 없었다|행동할 수 없었다|데미지를 입었다/.test(text)) return { kind: 'status', status: text }
  return null
}

export function buildImpactSounds(motion) {
  const targets = motion.targets || [motion]
  const connected = targets.filter(target => !target.isMiss)
  const sounds = [connected.length
    ? buildAttackSound({ ...motion, targetSide: connected[0].targetSide }, 'impact')
    : buildSituationSound('miss', { side: targets[0]?.targetSide })]
  for (const target of connected.filter(target => target.isDefeatingHit)) sounds.push(
    buildSituationSound('defeat', { species: target.targetSpecies, side: target.targetSide, delay: .14, gain: .55 }),
  )
  return sounds
}
