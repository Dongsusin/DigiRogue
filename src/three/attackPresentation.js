import profiles from '../data/attackProfiles.json' with { type: 'json' }
import skillInfo from '../data/attackSkillInfo.json' with { type: 'json' }
import { ATTACK_STYLES, inheritedAttackStyle } from './attackStyles.js'
import { clamp01, effectStyle, HIT_MS } from './battle3dMath.js'
import { FINAL_BOSS_MOVE_VISUALS } from '../data/finalBossProfiles.js'
import { ATTACK_RECOVERY_MS } from './animationTiming.js'
import { getSkillEffectRecipe, PALETTES } from './skillEffectRecipes.js'

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))
export const ATTACK_PROFILES = profiles

// Damage categories belong to the combat calculator. Presentation resolves a species + skill.
export function resolveAttackPresentation(event = {}) {
  const species = event.attackerSpecies || event.speciesName || ''
  const rig = profiles[species]
  const info = skillInfo[event.skillName] || {}
  const signature = rig?.signature[event.skillName]
  const bossVisual = event.finalBossMove ? FINAL_BOSS_MOVE_VISUALS[event.skillName] : null
  const recipe = getSkillEffectRecipe(event.skillName, bossVisual?.style || signature?.style || info.style || inheritedAttackStyle(event.skillName), event.attribute || info.attribute, species)
  const styleId = bossVisual?.style || recipe.style
  const style = ATTACK_STYLES[styleId] || ATTACK_STYLES.orb
  const contact = ['contact', 'native'].includes(style.delivery)
  const choices = contact ? ['attack01', 'attack02', 'special01', 'special02'] : ['special01', 'attack02', 'special02', 'attack01']
  const clip = signature?.clip || choices.find(name => rig?.clips[name]) || 'attack01'
  const sourceDuration = signature?.duration || rig?.clips[clip]?.duration || 1.6
  const duration = sourceDuration * (signature?.endFraction || 1)
  const authored = recipe.source === 'expansion-signature'
  const anchor = authored ? recipe.anchor : signature?.anchor || recipe.anchor || info.anchor || style.anchor
  const marker = clamp(signature?.releaseMarkers?.[0] ?? signature?.marker ?? rig?.clips[clip]?.markers[anchor === 'mouth' ? 'mouth' : contact ? 'weapon' : 'hand'] ?? .42, .05, duration / sourceDuration * .92)
  const baseMs = signature?.motionMs || clamp(duration * 520, 850, 2400)
  const markerSeconds = sourceDuration * marker
  const releaseMs = Math.round(clamp(baseMs * markerSeconds / duration, 280, 1600))
  const shots = authored ? recipe.shots : signature?.releaseMarkers?.length || signature?.shots || recipe.shots || info.shots || style.shots
  // Each emission gets a source landmark. The source advances between shots instead
  // of holding one pose while unrelated projectiles are manufactured by a timer.
  const available = Math.max(0, duration * .94 - markerSeconds)
  const step = Math.min(.18, available / Math.max(1, shots))
  const markers = signature?.releaseMarkers || Array.from({ length: shots }, (_, i) => (markerSeconds + i * step) / sourceDuration)
  const strikes = markers.map((fraction, i) => {
    const sourceSeconds = clamp(sourceDuration * fraction, markerSeconds, duration * .96)
    const at = i ? Math.max(releaseMs + i * 65, Math.round(releaseMs + (sourceSeconds - markerSeconds) * baseMs / duration)) : releaseMs
    return { releaseMs: at, impactMs: at + style.travelMs, sourceSeconds }
  })
  const last = strikes.at(-1)
  const volleyMs = last.releaseMs - releaseMs
  const impactMs = last.impactMs
  const motionMs = Math.round(Math.max(baseMs, impactMs + 280, last.releaseMs + (duration - last.sourceSeconds) * baseMs / duration))
  const clock = [{ atMs: 0, sourceSeconds: 0 }, ...strikes.map(strike => ({ atMs: strike.releaseMs, sourceSeconds: strike.sourceSeconds })), { atMs: motionMs, sourceSeconds: duration }]
  return {
    species, skillName: event.skillName, styleId, ...style, ...(recipe.shape ? { shape: recipe.shape } : {}),
    size: signature?.size || recipe.size || info.size || style.size, shots, clip, duration, sourceDuration, markerSeconds,
    emitter: { role: anchor, bone: (authored ? recipe.bone : signature?.bone) || rig?.anchors[anchor] || null,
      ...(authored ? { bones: recipe.bones, reach: recipe.emitterReach, lift: recipe.emitterLift } : {}),
      secondBone: recipe.secondBone || signature?.secondBone || (anchor === 'hands' ? rig?.anchors.leftHand : anchor === 'shoulders' ? rig?.anchors.leftShoulder : null),
      offset: signature?.offset, secondOffset: signature?.secondOffset },
    releaseMs, impactMs, volleyMs, motionMs, recoveryMs: ATTACK_RECOVERY_MS,
    totalMs: Math.max(motionMs + ATTACK_RECOVERY_MS, impactMs + HIT_MS) + 100,
    strikes, clock, bodyBone: rig?.anchors.body, groundLift: rig?.clips[clip]?.groundLift,
    palette: recipe.palette || effectStyle(event.attribute || info.attribute, event.skillName),
    motif: recipe.motif, impactKind: recipe.impact, trajectory: recipe.trajectory, formation: recipe.formation,
    shotColors: recipe.shotColors || (recipe.palette === PALETTES.rainbow ? [0xff7272,0xffd450,0x72e4a6,0x6bbdff,0xcf76ff] : undefined),
    effectSource: recipe.source || 'technique', beamWidth: recipe.beamWidth || 1,
    ...(recipe.motion ? { motionFx: { kind: recipe.motion } } : {}),
    area: Boolean(event.area ?? bossVisual?.area ?? info.area), source: bossVisual ? 'boss' : signature ? 'signature' : rig ? 'inherited' : 'fallback',
  }
}

// Animation, emitter poses, launch and damage share this monotonic piecewise clock.
export function sampleAttackClip(plan, elapsedMs) {
  const t = Math.max(0, elapsedMs)
  const clock = plan.clock || [{ atMs: 0, sourceSeconds: 0 }, { atMs: plan.releaseMs, sourceSeconds: plan.markerSeconds }, { atMs: plan.motionMs, sourceSeconds: plan.duration }]
  for (let i = 1; i < clock.length; i++) {
    const left = clock[i - 1], right = clock[i]
    if (t <= right.atMs) return left.sourceSeconds + (right.sourceSeconds - left.sourceSeconds) * clamp01((t - left.atMs) / (right.atMs - left.atMs))
  }
  return plan.duration
}

// A measured height envelope keeps the native airborne special above the map.
// It changes only presentation height, never bone keys, clip time or battle damage.
export function sampleAttackLift(plan, elapsedMs) {
  const curve = plan.groundLift
  if (!curve?.length || elapsedMs <= 0 || elapsedMs >= plan.motionMs) return 0
  const position = clamp01(sampleAttackClip(plan, elapsedMs) / plan.sourceDuration) * (curve.length - 1)
  const i = Math.floor(position), p = position - i
  return Math.max(0, curve[i] * (1 - p) + (curve[i + 1] ?? curve[i]) * p)
}

export function attackAdvance(plan, elapsedMs) {
  if (plan.movement === 'stationary') return 0
  const contact = plan.releaseMs
  const returnStart = Math.min(plan.motionMs - 180, contact + 140)
  if (elapsedMs < contact) return Math.sin(clamp01(elapsedMs / contact) * Math.PI / 2)
  if (elapsedMs < returnStart) return 1
  return Math.cos(clamp01((elapsedMs - returnStart) / (plan.motionMs - returnStart)) * Math.PI / 2)
}

export function sequenceAttacks(effects = []) {
  const casts = []
  for (const event of effects.filter(e => e?.targetId != null)) {
    const previous = casts.at(-1)
    const plan = resolveAttackPresentation(event)
    // Area damage is calculated per target, but must not replay the source animation per target.
    const sameCast = plan.area && previous && previous.event.attackerId === event.attackerId &&
      previous.event.attackerSide === event.attackerSide && previous.event.skillName === event.skillName &&
      !previous.targets.some(t => t.targetId === event.targetId && t.targetSide === event.targetSide)
    if (sameCast) previous.targets.push(event)
    else casts.push({ event, targets: [event], plan, offsetMs: previous ? previous.offsetMs + previous.plan.totalMs + 60 : 0 })
  }
  return casts
}
