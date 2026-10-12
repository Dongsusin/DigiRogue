import { SESSION_KEY } from './accountSession.js'

// Web Locks serialize claims. Device ownership survives restart; tab markers
// prevent an invalidated tab from borrowing the replacement tab's token.
export function createSessionStorage({ persistent, tab }) {
  const read = () => tab.getItem(SESSION_KEY) ?? persistent.getItem(SESSION_KEY)
  return {
    getItem: key => key === SESSION_KEY ? read() : tab.getItem(key),
    setItem(key, value) {
      if (key !== SESSION_KEY) { tab.setItem(key, value); return }
      const before = persistent.getItem(key), beforeTab = tab.getItem(key)
      try {
        persistent.setItem(key, value); tab.setItem(key, value)
        if (persistent.getItem(key) !== value || tab.getItem(key) !== value) throw new Error('Session storage unavailable')
      } catch (error) {
        if (persistent.getItem(key) === value) before === null ? persistent.removeItem(key) : persistent.setItem(key, before)
        beforeTab === null ? tab.removeItem(key) : tab.setItem(key, beforeTab)
        throw error
      }
    },
    removeItem(key) {
      if (key !== SESSION_KEY) { tab.removeItem(key); return }
      const own = read()
      tab.setItem(key, JSON.stringify({ blocked: true }))
      if (persistent.getItem(key) === own) persistent.removeItem(key)
    },
  }
}
