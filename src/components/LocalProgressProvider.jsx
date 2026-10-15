import { TRAINER_SKILLS_STORAGE_KEY } from '../progression/trainerSkills.js'
import { MODE_PROGRESS_STORAGE_KEY } from '../progression/modeProgress.js'
import { REGIONAL_TRUST_STORAGE_KEY } from '../progression/regionalTrustProgress.js'
import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { createCollectionStore } from '../progression/collectionStore.js'
import { LocalProgressContext } from '../progression/LocalProgressContext.js'
import { createLocalStorage } from '../progression/localStorage.js'
import { COLLECTION_STORAGE_KEY } from '../progression/digimonCollection.js'
import GameLoadingScreen from './GameLoadingScreen.jsx'

export default function LocalProgressProvider({ children, storage, namespace = null }) {
  const [store] = useState(() => createCollectionStore({ storage: storage ?? createLocalStorage(undefined, { namespace }) }))
  const progress = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const value = useMemo(() => ({ ...progress, storage: store.storage, recordGame: store.recordGame, recordItems: store.recordItems,
    configureAchievements: store.configureAchievements, updateTrainerProgress: store.updateTrainerProgress, subscribe: store.subscribe, getSnapshot: store.getSnapshot }), [progress, store])
  useEffect(() => {
    store.start()
    const reload = event => { if (event.key == null || [COLLECTION_STORAGE_KEY, REGIONAL_TRUST_STORAGE_KEY, TRAINER_SKILLS_STORAGE_KEY, MODE_PROGRESS_STORAGE_KEY].some(key => event.key === store.storage.key(key))) store.reloadLocal() }
    const refresh = () => store.reloadLocal()
    window.addEventListener('storage', reload)
    window.addEventListener('focus', refresh)
    return () => { store.stop(); window.removeEventListener('storage', reload); window.removeEventListener('focus', refresh) }
  }, [store])
  return <LocalProgressContext.Provider value={value}>
    <Suspense fallback={<GameLoadingScreen />}>{children}</Suspense>
  </LocalProgressContext.Provider>
}
