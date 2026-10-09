import { useEffect, useRef, useState } from 'react'
import { EvolutionPlayback, EVOLUTION_DURATION_MS, sampleEvolution } from '../three/evolutionTimeline.js'
import { gameAudio } from '../audio/GameAudio.js'
import { sampleCinematic } from '../three/cinematicTimeline.js'
import './EvolutionCutscene.css'

const phaseLabels = { intro: '새로운 가능성이 깨어납니다', charge: '힘을 하나로 모으는 중', transform: '새로운 모습으로 진화 중', reveal: '진화 성공', complete: '진화 완료' }
const rebuildPhaseLabels = { intro: '관리 프로그램을 동기화합니다', charge: '관리 데이터를 수집하는 중', transform: '관리 프로그램을 재구축하는 중', reveal: '재구축 성공', complete: '재구축 완료' }

export default function EvolutionCutscene({ scene, speed = 1, onComplete, previewAt = null }) {
  const hostRef = useRef(null)
  const flashRef = useRef(null)
  const beforeRef = useRef(null)
  const afterRef = useRef(null)
  const skipRef = useRef(null)
  const finishRef = useRef(null)
  const calloutRef = useRef(null)
  const splitRef = useRef(null)
  const nameCardRef = useRef(null)
  const letterboxRef = useRef(null)
  const callbackRef = useRef(onComplete)
  const previewRef = useRef(previewAt)
  const [view, setView] = useState({ mode: 'loading', phase: 'intro' })
  useEffect(() => { callbackRef.current = onComplete }, [onComplete])
  useEffect(() => { previewRef.current = previewAt }, [previewAt])

  const cinematic = scene.cinematic && scene.cinematic.template !== 'classic' ? scene.cinematic : null
  const duration = cinematic?.duration ?? EVOLUTION_DURATION_MS

  useEffect(() => {
    const host = hostRef.current
    const previouslyFocused = document.activeElement
    const playback = new EvolutionPlayback(speed, duration)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer, frameId, timeoutId, disposed = false, ready = false, mode = 'loading', phase = 'intro'
    let previousTime = performance.now(), soundPhase = null, audioPaused = false
    const resetClock = () => { previousTime = performance.now() }
    document.addEventListener('visibilitychange', resetClock)
    skipRef.current?.focus({ preventScroll: true })
    const finish = () => {
      if (disposed || !playback.finish()) return
      gameAudio.stopAll('evolution')
      callbackRef.current?.(scene.id)
    }
    finishRef.current = finish
    const fallback = (error) => {
      if (disposed || mode === 'fallback') return
      console.warn('Evolution preview unavailable:', error.message)
      window.clearTimeout(timeoutId)
      renderer?.dispose(); renderer = null
      mode = 'fallback'; ready = true; playback.start()
      setView({ mode, phase })
    }
    timeoutId = window.setTimeout(() => fallback(new Error('Model loading timed out')), 10000)
    const loadRenderer = cinematic
      ? import('../three/CinematicEvolutionRenderer.js').then(({ CinematicEvolutionRenderer }) => (options) => new CinematicEvolutionRenderer(host, { ...options, cinematic }))
      : import('../three/EvolutionRenderer.js').then(({ EvolutionRenderer }) => (options) => new EvolutionRenderer(host, options))
    const sample = (elapsed) => cinematic ? sampleCinematic(cinematic, elapsed, reducedMotion) : sampleEvolution(elapsed, reducedMotion)
    const chargeEnd = cinematic ? cinematic.beats.transform : 3000
    loadRenderer.then(async (create) => {
      if (disposed || mode === 'fallback') return
      renderer = create({ reducedMotion, onError: fallback })
      await renderer.load(scene)
      if (disposed || mode === 'fallback') return
      window.clearTimeout(timeoutId)
      renderer.render(0)
      mode = '3d'; ready = true; playback.start()
      setView({ mode, phase })
    }).catch(fallback)
    const tick = (now) => {
      if (disposed || playback.finished) return
      const paused = document.hidden || host.closest('[data-orientation-blocked="true"]') !== null
      const elapsed = previewRef.current == null
        ? playback.advance(now - previousTime, paused)
        : Math.max(0, Math.min(duration, previewRef.current))
      previousTime = now
      if (ready) {
        const state = sample(elapsed)
        if (state.phase !== phase) { phase = state.phase; setView({ mode, phase }) }
        if (paused || previewRef.current != null) {
          if (!audioPaused) gameAudio.stopAll('evolution')
          audioPaused = true
        } else if (soundPhase !== state.phase || audioPaused) {
          gameAudio.stopAll('evolution')
          gameAudio.situation('evolution-' + state.phase, { species: scene.to.name, speed, scope: 'evolution',
            duration: state.phase === 'charge' ? Math.max(.05, (chargeEnd - elapsed) / speed / 1000) : undefined })
          soundPhase = state.phase; audioPaused = false
        }
        if (!paused) {
          try { renderer?.render(elapsed) } catch (error) { fallback(error) }
        }
        flashRef.current.style.opacity = state.flash
        if (cinematic) {
          if (calloutRef.current) {
            calloutRef.current.style.opacity = state.callout
            calloutRef.current.style.transform = `translateX(${(1 - state.callout) * -8}%) skewX(-8deg)`
          }
          if (splitRef.current) splitRef.current.style.opacity = state.split
          if (nameCardRef.current) {
            nameCardRef.current.style.opacity = state.nameCard
            nameCardRef.current.style.transform = `translateY(${(1 - state.nameCard) * 18}px) scale(${1.12 - state.nameCard * 0.12})`
          }
          if (letterboxRef.current) letterboxRef.current.style.setProperty('--evo-bars', String(Math.min(1, state.progress * 12) * (1 - state.nameCard * 0.35)))
        }
        beforeRef.current.style.opacity = state.fromOpacity
        afterRef.current.style.opacity = state.toOpacity
        if (previewRef.current == null && elapsed >= duration) { finish(); return }
      }
      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => {
      disposed = true
      finishRef.current = null
      window.clearTimeout(timeoutId)
      cancelAnimationFrame(frameId)
      document.removeEventListener('visibilitychange', resetClock)
      renderer?.dispose()
      gameAudio.stopAll('evolution')
      if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true })
    }
  }, [scene, speed, cinematic, duration])

  const revealed = view.phase === 'reveal' || view.phase === 'complete'
  const isHatch = scene.mode === 'hatch'
  const isRebuild = scene.mode === 'rebuild'
  const fromNames = isHatch ? '디지몬 데이터 알' : scene.from.map((unit) => unit.name).join(' + ')
  const cinematicStyle = cinematic ? { '--evo-a': cinematic.palette[0], '--evo-b': cinematic.palette[1], '--evo-c': cinematic.palette[2] } : undefined
  return <div className="evolution-cinema" role="dialog" aria-modal="true" aria-label={isHatch ? '디지몬 부화' : isRebuild ? '관리 프로그램 재구축' : '디지몬 진화'} data-scene-kind={isHatch ? 'hatch' : isRebuild ? 'rebuild' : 'evolution'} data-phase={view.phase} data-render-mode={view.mode} data-cinematic={cinematic?.template} data-rumble={cinematic?.rumble ? 'true' : undefined} style={cinematicStyle} onKeyDown={(event) => {
    if (event.key === 'Escape') { event.stopPropagation(); finishRef.current?.() }
    if (event.key === 'Tab') { event.preventDefault(); skipRef.current?.focus() }
  }}>
    <div className="evolution-cinema__canvas" ref={hostRef} aria-hidden="true" />
    <div className="evolution-cinema__vignette" aria-hidden="true" />
    <div className="evolution-cinema__fallback" hidden={view.mode === '3d'} aria-hidden="true">
      <div className="evolution-cinema__fallback-ring" />
      <div className="evolution-cinema__fallback-models" ref={beforeRef}>
        {isHatch && <div className="evolution-cinema__data-egg" />}
        {scene.from.map((unit, i) => <img key={`${unit.name}-${i}`} src={unit.imageUrl} alt="" />)}
      </div>
      <div className="evolution-cinema__fallback-models" ref={afterRef} style={{ opacity: 0 }}><img src={scene.to.imageUrl} alt="" /></div>
    </div>
    {cinematic && <div className="evo-anime" aria-hidden="true">
      <div className="evo-anime__letterbox" ref={letterboxRef}><i /><i /></div>
      {scene.from.length > 1 && <div className="evo-anime__split" ref={splitRef} style={{ opacity: 0 }}>
        {scene.from.map((unit, i) => <div key={`${unit.name}-${i}`} className="evo-anime__panel" style={{ '--evo-panel': cinematic.sourcePalettes[i]?.[0] }}>
          <img src={unit.imageUrl} alt="" /><span>{unit.name}</span>
        </div>)}
      </div>}
      {cinematic.template === 'card' && <div className="evo-anime__callout" ref={calloutRef} style={{ opacity: 0 }}><span className="evo-anime__card" /></div>}
      <div className="evo-anime__namecard" ref={nameCardRef} style={{ opacity: 0 }}>
        <strong>{scene.to.name}</strong>
      </div>
    </div>}
    <div className="evolution-cinema__flash" ref={flashRef} aria-hidden="true" />
    <header className="evolution-cinema__header">
      <button type="button" className="evolution-cinema__skip" ref={skipRef} onClick={() => finishRef.current?.()}>건너뛰기 <span aria-hidden="true">≫</span></button>
    </header>
    <span className="evolution-cinema__accessible-status" role="status" aria-live="polite">
      {view.mode === 'loading' ? (isHatch ? '부화를 준비하고 있습니다' : isRebuild ? '재구축을 준비하고 있습니다' : '진화를 준비하고 있습니다')
        : isHatch ? (revealed ? scene.to.name : '') : `${(isRebuild ? rebuildPhaseLabels : phaseLabels)[view.phase]} · ${revealed ? scene.to.name : fromNames}`}
    </span>
    {isHatch && <>
    <div className="evolution-cinema__caption" aria-live="polite" aria-atomic="true">
      <h2>{revealed ? scene.to.name : ''}</h2>
    </div>
    </>}
  </div>
}
