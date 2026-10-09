const GUEST_KEY = 'digirogue-local-guest-v1'
const keys = new Set(['digirogue-collection-v1', 'digirogue-scan-progress-v1', 'digirogue-trainer-skills-v1',
  'digirogue-town-v1', 'digirogue-regional-trust-v1', 'digirogue-modes-v1', 'digirogue-save-v1', 'digirogue-save-slot-1-v1', 'digirogue-save-slot-2-v1',
  'digirogue-save-slot-3-v1', 'digirogue-settings-v1', 'digirogue-local-migration-v1', GUEST_KEY])
const permitted = key => keys.has(key) || /^digirogue-local-recovery-v1:digirogue-[a-z0-9-]+(?::\d+)?$/.test(key) ||
  /^digirogue-account:[^:]+:digirogue-(collection|scan-progress|trainer-skills|modes|save|save-slot-[1-3]|settings)-v1$/.test(key)

export function createLauncherStorage(bridge, previousStorage) {
  if (bridge.version !== 1 || bridge.gameId !== 'digilog') throw new Error('런처를 최신 버전으로 업데이트해 주세요.')
  let values = bridge.readStorage()
  if (values === null) {
    const legacy = {}
    if (previousStorage) for (let i = 0; i < previousStorage.length; i++) {
      const key = previousStorage.key(i)
      if (key && permitted(key)) legacy[key] = previousStorage.getItem(key)
    }
    // A successful native write is required before the game can open. Keep the
    // original browser records so a failed migration never discards progress.
    values = bridge.initializeStorage(legacy)
  }
  return {
    get length() { return Object.keys(values).length },
    key: index => Object.keys(values)[index] ?? null,
    getItem: key => values[key] ?? null,
    setItem(key, value) { const text = String(value); bridge.setItem(key, text); values = { ...values, [key]: text } },
    removeItem(key) { bridge.removeItem(key); const next = { ...values }; delete next[key]; values = next },
  }
}

export function ensureLocalGuest(storage, createId = () => crypto.randomUUID()) {
  const existing = storage?.getItem(GUEST_KEY)
  if (existing) return { ...JSON.parse(existing), isLocalGuest: true }
  const guest = { uid: `local-guest-${createId()}`, displayName: '로컬 게스트', isLocalGuest: true }
  storage?.setItem(GUEST_KEY, JSON.stringify(guest))
  return guest
}
