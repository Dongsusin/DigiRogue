import { useEffect, useRef, useState } from 'react'
import './BattleScene3D.css'

export default function BattleScene3D({ allies, enemies, actingId, actingSide = 'ally', targetIds, attackMotions, projectileEffects, hitEffects, switchEffects, captureEffects, gameSpeed, mapName, paused = false, onReady }) {
  const hostRef = useRef(null)
  const rendererRef = useRef(null)
  const latestRef = useRef(null)
  const onReadyRef = useRef(onReady)
  const [status, setStatus] = useState('3D 전투 준비 중…')

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    latestRef.current = { allies, enemies, actingId, actingSide, targetIds, attackMotions, projectileEffects, hitEffects, switchEffects, captureEffects, gameSpeed, mapName, paused }
    rendererRef.current?.update(latestRef.current)
  }, [allies, enemies, actingId, actingSide, targetIds, attackMotions, projectileEffects, hitEffects, switchEffects, captureEffects, gameSpeed, mapName, paused])

  useEffect(() => {
    let disposed = false
    let renderer
    const reportReady = (ready) => onReadyRef.current?.(ready)
    import('../three/BattleRenderer.js').then(({ BattleRenderer }) => {
      if (disposed) return
      renderer = new BattleRenderer(hostRef.current, {
        onReady: reportReady,
        onStatus: (message) => { if (!disposed) setStatus(message) },
      })
      rendererRef.current = renderer
      renderer.update(latestRef.current)
    }).catch((error) => {
      console.warn('3D battle unavailable', error)
      if (!disposed) { setStatus('3D 화면을 불러오지 못했습니다. 화면을 새로 고쳐 주세요.'); reportReady(false) }
    })
    return () => { disposed = true; rendererRef.current = null; renderer?.dispose(); reportReady(false) }
  }, [])

  return (
    <div className="battle-scene-3d" aria-label="디지몬 3D 전투 장면">
      <div className="battle-scene-3d__canvas" ref={hostRef} aria-hidden="true" />
      {!status.startsWith('3D BATTLE') && <span className="battle-scene-3d__status" role="status">{status}</span>}
    </div>
  )
}
