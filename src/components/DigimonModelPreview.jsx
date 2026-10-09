import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { getDigimonModel, getDigimonPreviewUrl } from '../data/digimonModels.js'
import './DigimonModelPreview.css'

// Shows one Digimon's 3D model. The wrapper takes over the host box (className); children (the
// model's pre-rendered thumbnail) show while the model loads. Front views use a matched portrait.
// `effect` plays a showcase light
// effect ('evolution-charge' | 'evolution-burst') over `effectMs`.
export default function DigimonModelPreview({ name, intro, effect, effectMs, facing = 'side', className = '', children }) {
  const hostRef = useRef(null)
  const rendererRef = useRef(null)
  const latestRef = useRef(null)
  const [attempt, setAttempt] = useState(0)
  const [issue, setIssue] = useState(null)
  const spec = getDigimonModel({ name })
  const hasModel = Boolean(spec)
  const poster = facing === 'front' ? getDigimonPreviewUrl(name) : ''
  useLayoutEffect(() => {
    latestRef.current = { name, intro, effect, effectMs, facing }
    // Switch before paint, so the previous species cannot flash below the new portrait.
    rendererRef.current?.updatePreview(latestRef.current)
  }, [name, intro, effect, effectMs, facing])
  useEffect(() => {
    if (!hasModel) return
    let disposed = false
    let renderer
    import('../three/BattleRenderer.js').then(({ BattleRenderer }) => {
      if (disposed) return
      renderer = new BattleRenderer(hostRef.current, {
        onReady: () => {},
        onStatus: message => {
          if (!disposed) setIssue(/못|끊|오류/.test(message) ? { name: latestRef.current.name, message } : null)
        },
      })
      rendererRef.current = renderer
      renderer.updatePreview(latestRef.current)
    }).catch(error => {
      if (!disposed) {
        setIssue({ name: latestRef.current.name, message: '모델을 불러오지 못했습니다.' })
        console.warn('3D preview unavailable', error.message)
      }
    })
    // Selection changes reuse this context and its bounded model cache.
    return () => { disposed = true; rendererRef.current = null; renderer?.dispose() }
  }, [hasModel, attempt])
  return (
    <div className={['digimon-model-preview', spec ? 'digimon-model-preview--3d' : '', className].filter(Boolean).join(' ')} data-3d-field data-facing={facing}>
      <div className="digimon-model-preview__canvas" ref={hostRef} aria-hidden="true" />
      {poster && <img key={poster} className="digimon-model-preview__poster" src={poster} alt="" aria-hidden="true" decoding="async" />}
      <div key={name} className="digimon-model-preview__anchor" data-combatant-id="preview" data-side="ally">
        {children}
      </div>
      {issue?.name === name && <button type="button" className="digimon-model-preview__retry" onClick={() => { setIssue(null); setAttempt(value => value + 1) }}>3D 다시 불러오기</button>}
    </div>
  )
}
