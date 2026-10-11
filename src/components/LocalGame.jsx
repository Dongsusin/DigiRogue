import { lazy, Suspense, useMemo, useState } from 'react'
import GameApp from './GameApp.jsx'
import GameLoadingScreen from './GameLoadingScreen.jsx'
import LoginScreen from './LoginScreen.jsx'
import './SessionVerification.css'
import { useAuthSession } from '../auth/AuthContext.js'
import GameDownloadGate from './GameDownloadGate.jsx'
import { initializeLauncherStorage, browserStorage, createLocalStorage } from '../progression/localStorage.js'
const LocalProgressProvider = lazy(() => import('./LocalProgressProvider.jsx'))
function prepareStorage() {
  try { initializeLauncherStorage(); return { ready: true, error: '' } }
  catch (failure) { return { ready: false, error: failure.message } }
}
export default function LocalGame() {
  const [{ ready, error }, setBoot] = useState(prepareStorage)
  const auth = useAuthSession()
  const profile = useMemo(() => auth?.identity ? createLocalStorage(browserStorage(), {
    accountId: auth.identity.isAnonymous ? null : auth.identity.uid, accountIsolation: true,
  }) : null, [auth?.identity?.uid, auth?.identity?.isAnonymous])
  if (error) return <section className="local-storage-error" role="alert">
    <h1>로컬 저장 기록을 준비하지 못했습니다</h1><p>{error}</p>
    <p>기존 저장 파일을 보존했습니다. 저장 폴더와 권한을 확인해 주세요.</p>
    <button type="button" onClick={() => setBoot(prepareStorage())}>다시 불러오기</button>
  </section>
  if (!ready || !auth?.ready) return <GameLoadingScreen />
  if (!auth.identity) return <LoginScreen />
  if (auth.busy) return <GameLoadingScreen />
  // Enter the game only after every shipped asset is installed in the persistent cache.
  return <GameDownloadGate><Suspense fallback={<GameLoadingScreen />}>
    <div className="session-game" inert={auth.sessionChecking || undefined}>
      <LocalProgressProvider key={auth.identity.uid + ':' + auth.identity.isAnonymous} storage={profile}>
        <GameApp />
      </LocalProgressProvider>
    </div>
    {auth.sessionChecking && <div className="session-verification" role="status" aria-live="polite">로그인 연결 확인 중…</div>}
  </Suspense></GameDownloadGate>
}
