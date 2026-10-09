import { useAuthSession } from '../auth/AuthContext.js'
import './LoginScreen.css'
export default function LoginScreen() {
  const { google, guest, busy, error } = useAuthSession()
  return <main className="login-screen">
    <div className="login-screen__grid" aria-hidden="true" />
    <section className="login-panel" aria-labelledby="login-title">
      <img className="login-panel__logo" src="/Title.png" alt="디지로그" />
      <div className="login-panel__divider"><span>DIGITAL WORLD</span></div>
      <h1 id="login-title">새로운 모험을 시작하세요</h1>
      <button className="login-button login-button--google" type="button" disabled={busy} onClick={google}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 4.9-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-4V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.9 5.4L6.4 10c.8-2.3 3-4.1 5.6-4.1Z"/></svg>
        Google로 시작
      </button>
      <button className="login-button login-button--guest" type="button" disabled={busy} onClick={guest}>게스트로 시작 <span aria-hidden="true">→</span></button>
      <p className="login-panel__status" role="status" aria-live="polite">{busy ? '로그인 중…' : error || '기록은 이 브라우저에 저장됩니다.'}</p>
    </section>
  </main>
}
