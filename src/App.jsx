import { useState } from 'react'
import './App.css'

const menuItems = [
  { label: '\uC0C8\uB85C\uD558\uAE30', current: true, disabled: false },
  { label: '\uC774\uC5B4\uD558\uAE30', current: false, disabled: true },
  { label: '\uC124\uC815', current: false, disabled: false },
]

const baseDigitDrops = [
  { duration: '8.4s', delay: '-5.2s', opacity: 0.46, scale: 0.95, swap: '2.4s' },
  { duration: '7.8s', delay: '-1.4s', opacity: 0.56, scale: 1.05, swap: '2.1s' },
  { duration: '9.1s', delay: '-6.7s', opacity: 0.42, scale: 0.9, swap: '2.6s' },
  { duration: '7.1s', delay: '-2.8s', opacity: 0.62, scale: 1.12, swap: '1.9s' },
  { duration: '9.8s', delay: '-8.5s', opacity: 0.4, scale: 0.88, swap: '2.5s' },
  { duration: '6.9s', delay: '-3.3s', opacity: 0.58, scale: 1, swap: '2s' },
  { duration: '8.7s', delay: '-0.6s', opacity: 0.5, scale: 1.08, swap: '2.2s' },
  { duration: '10.2s', delay: '-7.4s', opacity: 0.38, scale: 0.86, swap: '2.8s' },
  { duration: '7.4s', delay: '-4.9s', opacity: 0.55, scale: 1.04, swap: '2.05s' },
  { duration: '8.9s', delay: '-1.8s', opacity: 0.47, scale: 0.94, swap: '2.35s' },
  { duration: '7.7s', delay: '-6.1s', opacity: 0.6, scale: 1.14, swap: '1.85s' },
  { duration: '9.5s', delay: '-2.2s', opacity: 0.41, scale: 0.9, swap: '2.55s' },
  { duration: '7.2s', delay: '-5.5s', opacity: 0.57, scale: 1.02, swap: '2s' },
  { duration: '8.8s', delay: '-7.9s', opacity: 0.45, scale: 0.92, swap: '2.3s' },
  { duration: '6.8s', delay: '-4.1s', opacity: 0.53, scale: 1.08, swap: '1.75s' },
]

const getRandomLeft = () => `${(Math.random() * 92 + 4).toFixed(1)}%`
const getRandomDrift = () => `${(Math.random() * 24 - 12).toFixed(1)}px`

const createDigitDrop = (drop, index) => ({
  ...drop,
  id: index,
  left: getRandomLeft(),
  drift: getRandomDrift(),
})

function App() {
  const [digitDrops, setDigitDrops] = useState(() =>
    baseDigitDrops.map((drop, index) => createDigitDrop(drop, index))
  )

  const repositionDigitDrop = (dropId) => {
    setDigitDrops((currentDrops) =>
      currentDrops.map((drop) =>
        drop.id === dropId
          ? {
              ...drop,
              left: getRandomLeft(),
              drift: getRandomDrift(),
            }
          : drop
      )
    )
  }

  const handleDigitLoop = (dropId, event) => {
    if (event.target !== event.currentTarget || event.animationName !== 'digit-fall') {
      return
    }

    repositionDigitDrop(dropId)
  }

  return (
    <main className="main-screen">
      <div className="main-screen__veil" aria-hidden="true" />
      <div className="digit-rain" aria-hidden="true">
        {digitDrops.map((drop) => (
          <div
            key={drop.id}
            className={[
              'digit-drop',
              drop.id % 2 === 1 ? 'digit-drop--invert' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onAnimationIteration={(event) => handleDigitLoop(drop.id, event)}
            style={{
              '--drop-left': drop.left,
              '--drop-duration': drop.duration,
              '--drop-delay': drop.delay,
              '--drop-opacity': drop.opacity,
              '--drop-scale': drop.scale,
              '--drop-drift': drop.drift,
              '--swap-duration': drop.swap,
            }}
          >
            <span className="digit-drop__value digit-drop__value--zero">0</span>
            <span className="digit-drop__value digit-drop__value--one">1</span>
          </div>
        ))}
      </div>

      <header className="title-band">
        <div className="title-band__inner">
          <img className="title-band__logo" src="/Title.png" alt="DigiRogue" />
        </div>
      </header>

      <section className="playfield">
        <div className="playfield__scanline" aria-hidden="true" />

        <div className="playfield__content">
          <aside className="menu-panel">
            <nav className="menu-panel__list" aria-label="\uBA54\uC778 \uBA54\uB274">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className={[
                    'menu-item',
                    item.current ? 'menu-item--current' : '',
                    item.disabled ? 'menu-item--disabled' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={item.disabled}
                >
                  <span className="menu-item__marker" aria-hidden="true">
                    {item.current ? '\u25B6' : ''}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default App
