import { TRAINER_SKILLS_STORAGE_KEY } from './trainerSkills.js'
// Web Locks serialize the whole read/modify/write across tabs of this origin.
// The local queue also guards reentrant native/test storage callbacks.
const active = new Set(), waiting = new Map()
function locally(name, work) {
  if (active.has(name)) return new Promise((resolve, reject) => {
    const queue = waiting.get(name) ?? []; queue.push({ work, resolve, reject }); waiting.set(name, queue)
  })
  active.add(name)
  try { return work() } finally {
    active.delete(name)
    const queue = waiting.get(name), next = queue?.shift()
    if (!queue?.length) waiting.delete(name)
    if (next) queueMicrotask(() => { try { next.resolve(locally(name, next.work)) } catch (error) { next.reject(error) } })
  }
}
export function withTrainerTransaction(storage, work) {
  const name = 'digirogue-trainer:' + (storage.key?.(TRAINER_SKILLS_STORAGE_KEY) ?? TRAINER_SKILLS_STORAGE_KEY)
  const locks = typeof window !== 'undefined' ? window.navigator?.locks : null
  return locks?.request ? locks.request(name, () => locally(name, work)) : locally(name, work)
}
