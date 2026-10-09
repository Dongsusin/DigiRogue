let pending
export function loadGameModule() {
  // Local profile initialization runs in parallel with downloading the game.
  // A failed speculative import remains retryable.
  pending ??= import('../App.jsx').catch(error => { pending = null; throw error })
  return pending
}
