// Every roster species has an exact 3D model. Source pages and use restrictions
// are retained in the manifest and docs/3d-assets.md.
import manifest from './digimonModelManifest.json' with { type: 'json' }
import { canonicalDigimonName } from './digimonNames.js'

export const DIGIMON_MODELS = Object.freeze(Object.fromEntries(
  Object.entries(manifest).map(([name, entry]) => [name, Object.freeze({ ...entry, name, format: 'glb', rotationY: entry.rotationY || 0 })]),
))

// Every Digimon in the game needs these animations (canonical clip names from the importer).
// Species whose model lacks any of them are left out of the roster.
export const REQUIRED_CLIPS = Object.freeze({
  idle: ['idle'],
  attack: ['attack01', 'attack02', 'special01', 'special02'],
  damage: ['damage'],
  die: ['down'],
})

export function missingRequiredClips(clips = []) {
  return Object.entries(REQUIRED_CLIPS)
    .filter(([, names]) => !names.some((name) => clips.includes(name)))
    .map(([role]) => role)
}

// Authored idle/hit/defeat are allowed. Any authored attack excludes the species.
export function hasAuthoredAttackMotion(model) {
  return (model?.authoredMotion?.roles ?? []).some(role => /^(?:attack|special)/i.test(role))
}

export function getDigimonModel(combatant) {
  const candidates = typeof combatant === 'string'
    ? [combatant]
    : [combatant?.imageName, combatant?.speciesName, combatant?.name, combatant?.['이름']]
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue
    const model = DIGIMON_MODELS[canonicalDigimonName(candidate)]
    if (model) return model
  }
  return null
}

// Transparent render of the model's idle pose (public/models/digimon/thumbs/<slug>.webp).
export function getDigimonThumbnailUrl(name) {
  const model = getDigimonModel(name)
  return model ? model.url.replace(/\/([^/]+)\.glb$/, '/thumbs/$1.webp') : ''
}

// Front-facing loading portraits are rendered with the same camera and pose as the live preview.
export function getDigimonPreviewUrl(name) {
  const model = getDigimonModel(name)
  return model ? model.url.replace(/\/([^/]+)\.glb$/, '/previews/$1.webp') : ''
}
