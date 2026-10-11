export const MAP_ROTATION_MS = 9000
export const MAP_FADE_MS = 2600

export function pickNextBackgroundIndex(length, currentIndex = -1, random = Math.random) {
  if (length <= 1) return 0
  const sample = Math.min(0.999999999, Math.max(0, random()))
  if (currentIndex < 0 || currentIndex >= length) return Math.floor(sample * length)
  const candidate = Math.floor(sample * (length - 1))
  return candidate >= currentIndex ? candidate + 1 : candidate
}

// Decode the next map before revealing it. A failed request keeps the current map.
export function loadMenuBackground(url, { ImageClass = Image, timeoutMs = 8000 } = {}) {
  return new Promise(resolve => {
    const image = new ImageClass()
    let settled = false
    const finish = ready => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      image.onload = image.onerror = null
      resolve(ready)
    }
    const timeout = setTimeout(() => finish(false), timeoutMs)
    image.onload = async () => {
      try {
        if (image.decode) await image.decode()
        finish(image.naturalWidth > 0)
      } catch { finish(false) }
    }
    image.onerror = () => finish(false)
    image.src = url
  })
}

// Keep decorative timers outside App, so each cycle does not render the game engine.
export function createMenuBackgroundRotation({ urls, initialIndex, onChange,
  loadImage = loadMenuBackground, random = Math.random,
  setTimer = setTimeout, clearTimer = clearTimeout, paused = false }) {
  let state = { activeIndex: initialIndex, previousIndex: initialIndex, isFading: false }
  let timer, generation = 0, disposed = false
  const schedule = () => {
    if (disposed || paused || urls.length < 2) return
    const token = generation
    const nextIndex = pickNextBackgroundIndex(urls.length, state.activeIndex, random)
    const ready = Promise.resolve().then(() => loadImage(urls[nextIndex])).catch(() => false)
    timer = setTimer(async () => {
      if (!await ready || disposed || paused || token !== generation) {
        if (!disposed && !paused && token === generation) schedule()
        return
      }
      state = { previousIndex: state.activeIndex, activeIndex: nextIndex, isFading: true }
      onChange(state)
      timer = setTimer(() => {
        if (disposed || paused || token !== generation) return
        state = { ...state, previousIndex: state.activeIndex, isFading: false }
        onChange(state)
        schedule()
      }, MAP_FADE_MS)
    }, MAP_ROTATION_MS)
  }
  schedule()
  return {
    setPaused(value) {
      if (disposed || paused === value) return
      paused = value
      generation += 1
      clearTimer(timer)
      if (state.isFading) {
        state = { ...state, previousIndex: state.activeIndex, isFading: false }
        onChange(state)
      }
      schedule()
    },
    dispose() {
      disposed = true
      generation += 1
      clearTimer(timer)
    },
  }
}

export const BASE_DIGIT_DROPS = [
  { duration: '8.4s', delay: '-5.2s', opacity: 0.46, scale: 0.95, swap: '2.4s' },
  { duration: '7.8s', delay: '-1.4s', opacity: 0.56, scale: 1.05, swap: '2.1s' },
  { duration: '9.1s', delay: '-6.7s', opacity: 0.42, scale: 0.9, swap: '2.6s' },
  { duration: '7.1s', delay: '-2.8s', opacity: 0.62, scale: 1.12, swap: '1.9s' },
  { duration: '9.8s', delay: '-8.5s', opacity: 0.4, scale: 0.88, swap: '2.5s' },
  { duration: '6.9s', delay: '-3.3s', opacity: 0.58, scale: 1, swap: '2s' },
  { duration: '8.7s', delay: '-0.6s', opacity: 0.5, scale: 1.08, swap: '2.2s' },
  { duration: '10.2s', delay: '-7.4s', opacity: 0.38, scale: 0.86, swap: '2.8s' },
  { duration: '7.4s', delay: '-4.9s', opacity: 0.55, scale: 1.04, swap: '2.05s' },
  { duration: '8.9s', delay: '-1.8s', opacity: 0.47, scale: 0.94, swap: '2.35s' },
  { duration: '7.7s', delay: '-6.1s', opacity: 0.6, scale: 1.14, swap: '1.85s' },
  { duration: '9.5s', delay: '-2.2s', opacity: 0.41, scale: 0.9, swap: '2.55s' },
  { duration: '7.2s', delay: '-5.5s', opacity: 0.57, scale: 1.02, swap: '2s' },
  { duration: '8.8s', delay: '-7.9s', opacity: 0.45, scale: 0.92, swap: '2.3s' },
  { duration: '6.8s', delay: '-4.1s', opacity: 0.53, scale: 1.08, swap: '1.75s' },
]

export const randomDigitPosition = () => ({
  left: ((Math.random() * 92 + 4).toFixed(1)) + '%',
  drift: ((Math.random() * 24 - 12).toFixed(1)) + 'px',
})
