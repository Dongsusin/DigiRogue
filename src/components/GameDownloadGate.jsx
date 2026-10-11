import { useEffect, useSyncExternalStore } from 'react'
import { gameDownloadState, startGameDownload, subscribeGameDownload } from '../loading/gameDownload.js'
import './GameDownloadGate.css'
const megabytes = bytes => (bytes / 1024 / 1024).toFixed(1)
export default function GameDownloadGate({ children }) {
  const download = useSyncExternalStore(subscribeGameDownload, gameDownloadState)
  useEffect(() => { startGameDownload() }, [])
  if (download.phase === 'ready') return children
  const percent = download.totalBytes ? Math.min(100, Math.floor(download.loadedBytes / download.totalBytes * 100)) : 0
  const failed = download.phase === 'error'
  return <main className="game-download">
    <section className="game-download__panel" aria-labelledby="download-title">
      <img className="game-download__logo" src="/Title.png" alt="디지로그" />
      <span className="game-download__eyebrow">DIGITAL WORLD · DATA LINK</span>
      <h1 id="download-title">{failed ? '다운로드를 완료하지 못했습니다' : download.phase === 'checking' ? '게임 데이터 확인 중' : '게임 데이터 다운로드'}</h1>
      <p className="game-download__message">{failed ? download.error : download.phase === 'checking' ? '저장된 데이터를 확인하고 있습니다.' : '모든 데이터가 준비되면 게임이 시작됩니다.'}</p>
      <div className="game-download__summary"><span>{download.completed.toLocaleString()} / {download.total.toLocaleString()} 파일</span><strong>{percent}<small>%</small></strong></div>
      <div className="game-download__progress" role="progressbar" aria-label="게임 데이터 다운로드" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={percent + '%'}>
        <span style={{ width: percent + '%' }} />
      </div>
      <div className="game-download__bytes"><span>{megabytes(download.loadedBytes)} / {megabytes(download.totalBytes)} MB</span><span>다운로드 후 기기에 보관</span></div>
      {failed ? <button className="game-download__retry" type="button" onClick={startGameDownload}>다시 시도</button> : <p className="game-download__note">한 번 받은 데이터는 다음 접속에도 사용합니다.</p>}
    </section>
  </main>
}
