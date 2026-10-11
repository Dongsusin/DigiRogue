import { useEffect, useState } from 'react'
import { BASE_DIGIT_DROPS, createMenuBackgroundRotation, pickNextBackgroundIndex, randomDigitPosition } from './menuBackdrop.js'
import './MenuBackdrop.css'

export default function MenuBackdrop({ backgrounds }) {
  const [transition, setTransition] = useState(() => {
    const index = pickNextBackgroundIndex(backgrounds.length)
    return { activeIndex: index, previousIndex: index, isFading: false }
  })
  const [hidden, setHidden] = useState(() => document.hidden)
  const [drops, setDrops] = useState(() => BASE_DIGIT_DROPS.map((drop, id) => ({ ...drop, id, ...randomDigitPosition() })))
  useEffect(() => {
    const rotation = createMenuBackgroundRotation({ urls: backgrounds,
      initialIndex: transition.activeIndex, onChange: setTransition, paused: document.hidden })
    const onVisibility = () => { setHidden(document.hidden); rotation.setPaused(document.hidden) }
    document.addEventListener('visibilitychange', onVisibility)
    return () => { rotation.dispose(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [backgrounds])
  const reposition = (id, event) => {
    if (event.target !== event.currentTarget || event.animationName !== 'digit-fall') return
    setDrops(current => current.map(drop => drop.id === id ? { ...drop, ...randomDigitPosition() } : drop))
  }
  return <>
    <div className="main-screen__background main-screen__background--base" aria-hidden="true"
      style={{ backgroundImage: 'url("' + backgrounds[transition.isFading ? transition.previousIndex : transition.activeIndex] + '")' }} />
    <div className={['main-screen__background main-screen__background--next', transition.isFading ? 'main-screen__background--visible' : ''].filter(Boolean).join(' ')} aria-hidden="true"
      style={{ backgroundImage: 'url("' + backgrounds[transition.activeIndex] + '")' }} />
    <div className="main-screen__veil" aria-hidden="true" />
    <div className="digit-rain" aria-hidden="true" data-paused={hidden}>
      {drops.map(drop => <div key={drop.id} className={'digit-drop' + (drop.id % 2 ? ' digit-drop--invert' : '')}
        onAnimationIteration={event => reposition(drop.id, event)}
        style={{ '--drop-left': drop.left, '--drop-duration': drop.duration, '--drop-delay': drop.delay,
          '--drop-opacity': drop.opacity, '--drop-scale': drop.scale, '--drop-drift': drop.drift, '--swap-duration': drop.swap }}>
        <span className="digit-drop__value digit-drop__value--zero">0</span>
        <span className="digit-drop__value digit-drop__value--one">1</span>
      </div>)}
    </div>
  </>
}
