import { bgmTracks, getSceneBgmTracks } from './bgmCatalog.js'

export const BGM_SCHEMA_VERSION = 3
export const createDefaultBgmSettings = () => ({
  bgmSchemaVersion: BGM_SCHEMA_VERSION,
  enabledBgmUrls: bgmTracks.map(track => track.url),
})

export const sanitizeBgmSettings = settings => {
  // Retired licensed-song settings start with the original AI soundtrack.
  // Version 2 users receive only the newly added themes once; their disabled
  // original themes and explicit all-OFF preference remain disabled.
  if (![2, BGM_SCHEMA_VERSION].includes(settings?.bgmSchemaVersion)) return createDefaultBgmSettings()
  const knownUrls = new Set(bgmTracks.map(track => track.url))
  let enabledBgmUrls = Array.isArray(settings?.enabledBgmUrls)
    ? [...new Set(settings.enabledBgmUrls.filter(url => typeof url === 'string' && knownUrls.has(url)))]
    : createDefaultBgmSettings().enabledBgmUrls
  if (settings.bgmSchemaVersion === 2 && enabledBgmUrls.length > 0) {
    enabledBgmUrls = [...new Set([...enabledBgmUrls,
      ...bgmTracks.filter(track => track.introducedIn > 2).map(track => track.url)])]
  }
  return { bgmSchemaVersion: BGM_SCHEMA_VERSION, enabledBgmUrls }
}

export const getEnabledBgmTracks = (settings, scene = null) => {
  const enabled = new Set(sanitizeBgmSettings(settings).enabledBgmUrls)
  const tracks = bgmTracks.filter(track => enabled.has(track.url))
  return scene ? getSceneBgmTracks(tracks, scene) : tracks
}
