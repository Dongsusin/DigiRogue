// A renderer keeps local leases to decoded templates. Active actors cannot be
// evicted; the shared cache releases their resources only after every lease ends.
export class ModelAssetCache {
  constructor({ load, dispose, isPinned = () => false, limit = 8 }) {
    this.load = load
    this.disposeAsset = dispose
    this.isPinned = isPinned
    this.limit = limit
    this.entries = new Map()
    this.disposed = false
  }

  get(url) {
    if (this.disposed) return Promise.reject(new Error('Model cache disposed'))
    const cached = this.entries.get(url)
    if (cached) {
      this.entries.delete(url)
      this.entries.set(url, cached)
      return cached.promise
    }
    const entry = {}
    entry.promise = Promise.resolve().then(() => this.load(url)).then(asset => {
      if (this.disposed) {
        this.disposeAsset(asset)
        throw new Error('Model cache disposed')
      }
      entry.asset = asset
      this.trim()
      return asset
    }).catch(error => {
      // A failed request must not poison subsequent selections or a retry.
      if (this.entries.get(url) === entry) this.entries.delete(url)
      throw error
    })
    this.entries.set(url, entry)
    return entry.promise
  }

  trim() {
    let count = [...this.entries.values()].filter(entry => entry.asset).length
    for (const [url, entry] of this.entries) {
      if (count <= this.limit) break
      if (!entry.asset || this.isPinned(url)) continue
      this.entries.delete(url)
      this.disposeAsset(entry.asset)
      count--
    }
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    for (const entry of this.entries.values()) if (entry.asset) this.disposeAsset(entry.asset)
    this.entries.clear()
  }
}
