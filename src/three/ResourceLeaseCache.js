// A renderer owns a lease, not the decoded template. Multiple WebGL contexts
// may use it; eviction must never dispose geometry/textures still in use.
export class ResourceLeaseCache {
  constructor({ load, dispose, estimate = () => 1, limit = 6, maxBytes = Infinity, concurrency = 2 }) {
    Object.assign(this, { load, disposeAsset: dispose, estimate, limit, maxBytes, concurrency })
    this.entries = new Map(); this.queue = []; this.loading = 0
  }

  acquire(key) {
    let entry = this.entries.get(key)
    if (!entry) {
      entry = { refs: 0, bytes: 0 }
      entry.promise = new Promise((resolve, reject) => { this.queue.push({ key, entry, resolve, reject }) })
      this.entries.set(key, entry)
    } else { this.entries.delete(key); this.entries.set(key, entry) }
    entry.refs++
    this.pump()
    return entry.promise.then(asset => {
      let released = false
      return { ...asset, release: () => {
        if (released) return
        released = true; entry.refs--
        this.trim()
      } }
    })
  }

  pump() {
    while (this.loading < this.concurrency && this.queue.length) {
      const { key, entry, resolve, reject } = this.queue.shift()
      this.loading++
      Promise.resolve().then(() => this.load(key)).then(asset => {
        entry.asset = asset; entry.bytes = Math.max(0, this.estimate(asset) || 0)
        resolve(asset)
      }).catch(error => {
        if (this.entries.get(key) === entry) this.entries.delete(key)
        reject(error)
      }).finally(() => {
        this.loading--; this.trim()
        // Yield between decode batches so input/paint can run during large
        // encounters, rather than resolving every model in one long task.
        setTimeout(() => this.pump(), 0)
      })
    }
  }

  trim({ all = false } = {}) {
    let count = 0, bytes = 0
    for (const entry of this.entries.values()) if (entry.asset) { count++; bytes += entry.bytes }
    for (const [key, entry] of this.entries) {
      if (!all && count <= this.limit && bytes <= this.maxBytes) break
      if (!entry.asset || entry.refs > 0) continue
      this.entries.delete(key); count--; bytes -= entry.bytes
      this.disposeAsset(entry.asset)
    }
  }
}
