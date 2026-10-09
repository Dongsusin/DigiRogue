import catalog from './digimonStageProfiles.json' with { type: 'json' }

// Browsing order is not an evolution ladder: Armor and Hybrid have many power levels.
export const DIGIMON_STAGES = Object.freeze([
  '유아기', '유년기', '성장기', '성숙기', '아머체', '하이브리드체', '완전체', '궁극체', '초궁극체',
])
// Keep saved training-node indices intact when adding the two special generations.
export const LEGACY_DIGIMON_STAGES = Object.freeze(['유아기', '유년기', '성장기', '성숙기', '완전체', '궁극체', '초궁극체'])
export const DIGIMON_STAGE_PROFILES = Object.freeze(catalog.profiles)

const stageRanks = Object.freeze({ 유아기: 0, 유년기: 1, 성장기: 2, 성숙기: 3,
  아머체: 3, 하이브리드체: 3, 완전체: 4, 궁극체: 5, 초궁극체: 6 })
const speciesName = value => typeof value === 'string' ? value
  : value?.이름 ?? value?.speciesData?.이름 ?? value?.speciesName ?? value?.imageName ?? value?.name

export function getDigimonStageProfile(species) {
  return DIGIMON_STAGE_PROFILES[speciesName(species)] ?? null
}

export function getDigimonStageRank(stage) {
  return stageRanks[stage] ?? -1
}

// Existing learning schedules and encounter bands remain species-specific after reclassification.
export function getDigimonTrainingStage(species, fallback = '성숙기') {
  return getDigimonStageProfile(species)?.trainingStage ?? species?.stage ?? species?.speciesStage ?? fallback
}

export function getDigimonTrainingRank(species, fallback) {
  return getDigimonStageRank(getDigimonTrainingStage(species, fallback))
}

export function getDigimonStageSource(species) {
  const profile = getDigimonStageProfile(species)
  return profile?.classification?.source ?? profile?.source ?? (profile?.directory
    ? `https://digimon.net/reference_ko/detail.php?directory_name=${encodeURIComponent(profile.directory)}` : '')
}
