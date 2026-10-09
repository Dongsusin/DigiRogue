export const PROFILE_PROGRESS_KEYS = Object.freeze([
  'digirogue-collection-v1', 'digirogue-scan-progress-v1', 'digirogue-trainer-skills-v1',
  'digirogue-town-v1', 'digirogue-regional-trust-v1', 'digirogue-modes-v1',
  'digirogue-save-v1', ...[1, 2, 3].map(n => 'digirogue-save-slot-' + n + '-v1'),
  'digirogue-settings-v1', 'digirogue-local-migration-v1',
])
export const accountStorageKey = (uid, key) => 'digirogue-account:' + encodeURIComponent(uid) + ':' + key
// Linking a guest is an explicit migration. A returning Google profile always wins.
export function importGuestProgress(storage, uid) {
  if (!storage || !uid) throw new Error('저장 공간을 준비하지 못했습니다.')
  if (PROFILE_PROGRESS_KEYS.some(key => storage.getItem(accountStorageKey(uid, key)) !== null)) return { copied: false, reason: 'existing-account' }
  const copied = []
  try {
    for (const key of PROFILE_PROGRESS_KEYS) {
      const value = storage.getItem(key)
      if (value === null) continue
      const destination = accountStorageKey(uid, key)
      storage.setItem(destination, value)
      copied.push(destination)
      if (storage.getItem(destination) !== value) throw new Error('저장 기록을 유지하지 못했습니다.')
    }
    return { copied: true, keys: copied }
  } catch (error) {
    for (const key of copied) { try { storage.removeItem(key) } catch { /* Original guest data remains intact. */ } }
    throw error
  }
}
export function authErrorMessage(error) {
  const messages = {
    'auth/popup-closed-by-user': '로그인이 취소되었습니다.',
    'auth/cancelled-popup-request': '다른 로그인 창을 확인해 주세요.',
    'auth/popup-blocked': '팝업을 허용한 뒤 다시 시도해 주세요.',
    'auth/network-request-failed': '네트워크 연결을 확인해 주세요.',
    'auth/unauthorized-domain': '이 주소에서 Google 로그인을 준비하고 있습니다.',
    'auth/operation-not-allowed': '로그인 설정을 확인하고 있습니다. 잠시 후 다시 시도해 주세요.',
    'auth/too-many-requests': '요청이 많습니다. 잠시 후 다시 시도해 주세요.',
  }
  return messages[error?.code] ?? '로그인하지 못했습니다. 다시 시도해 주세요.'
}
