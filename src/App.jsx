import { useEffect, useState } from 'react'
import './App.css'

const menuItems = [
  { label: '\uC0C8\uB85C\uD558\uAE30', key: 'new-game', disabled: false },
  { label: '\uC774\uC5B4\uD558\uAE30', key: 'continue', disabled: true },
  { label: '\uC124\uC815', key: 'settings', disabled: false },
]

const growthStageDigimonUrls = [
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EA%B0%80%EC%98%A4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EA%B0%80%EC%A7%80%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EA%B3%A0%EB%B6%80%EB%A6%AC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EA%B8%B8%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%8F%84%EB%A3%A8%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%93%9C%EB%9D%BC%EC%BD%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%93%9C%EB%9D%BC%ED%81%90%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%9D%BC%EB%9D%BC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%A0%88%EB%82%98%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%A1%9C%ED%94%84%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%A3%A8%EC%B2%B4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%A5%98%EC%9A%B0%EB%8B%A4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%AA%A8%EB%85%B8%EB%93%9C%EB%9D%BC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%B2%A0%ED%83%80%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%B3%B4%EB%B3%B4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%B8%8C%EC%9D%B4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EB%B8%94%EB%A3%A8%EC%BD%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%82%AC%EC%9D%B4%EC%BC%80%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%83%A4%EC%BD%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%89%AC%EB%9D%BC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%8A%A4%EC%9C%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%95%84%EA%B5%AC%EB%AA%AC(%ED%9D%91).png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%95%84%EA%B5%AC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%95%84%EA%B8%B0%EB%B2%8C%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%95%84%EB%A5%B4%EB%A7%88%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%97%90%EB%A0%89%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%98%AC%EC%B1%99%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%98%B7%EC%BD%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%9A%B8%ED%89%81%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%9E%84%ED%94%84%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%B6%94%EC%B6%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%B8%84%EC%B9%B4%EC%9D%B4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%B9%B4%EB%A9%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%BC%80%EB%9D%BC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%BD%94%ED%85%8C%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%BF%A0%EB%84%A4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%EC%BF%A0%EB%8B%A4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%81%AC%EB%9E%A9%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%85%8C%EB%A6%AC%EC%96%B4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%85%90%ED%83%80%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%86%A0%EC%9D%B4%EC%95%84%EA%B5%AC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%86%B1%EB%8B%88%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%8C%85%EC%BB%A4%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%8C%8C%EB%8B%A5%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%8C%8C%ED%94%BC%EB%AA%AC(%ED%9D%91).png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%8C%8C%ED%94%BC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%8C%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%8C%94%EC%BD%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%8E%AD%EA%B7%84%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%8F%BC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%94%8C%EB%A1%9C%EB%9D%BC%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%94%8C%EB%A1%AF%ED%8A%B8%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%94%BC%EC%9A%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%94%BC%EC%BD%94%EB%8D%B0%EB%B8%94%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%97%89%EB%AA%AC.png',
  '/%EB%8F%84%EA%B0%90/%EC%84%B1%EC%9E%A5%EA%B8%B0/%ED%98%B8%ED%81%AC%EB%AA%AC.png',
]

const growthStageDigimon = growthStageDigimonUrls.map((url) => {
  const fileName = decodeURIComponent(url.split('/').pop() ?? '')
  return {
    url,
    name: fileName.replace('.png', ''),
  }
})

const mapBackgrounds = [
  '/%EB%A7%B5/%EA%B0%80%EB%94%94%EC%96%B8%20%ED%8C%B0%EB%A6%AC%EC%8A%A4.png',
  '/%EB%A7%B5/%EA%B2%90%EC%8B%9C%20%EB%8C%80%EB%A5%99.png',
  '/%EB%A7%B5/%EA%B8%B0%EC%96%B4%20%ED%8F%AC%EB%A0%88%EC%8A%A4%ED%8A%B8.png',
  '/%EB%A7%B5/%EA%B8%B0%EC%96%B4%EC%82%AC%EB%B0%94%EB%82%98.png',
  '/%EB%A7%B5/%EB%82%98%EC%9D%B4%ED%8A%B8%EB%A9%94%EC%96%B4%20%EC%86%94%EC%A0%80%EC%8A%A4.png',
  '/%EB%A7%B5/%EB%84%A4%ED%8A%B8%EC%9D%98%20%EB%B0%94%EB%8B%A4.png',
  '/%EB%A7%B5/%EB%8B%A4%ED%81%AC%20%EC%97%90%EB%A6%AC%EC%96%B4.png',
  '/%EB%A7%B5/%EB%8B%A4%ED%81%AC%20%EC%9B%B9.png',
  '/%EB%A7%B5/%EB%8B%A4%ED%81%AC%20%ED%95%84%EB%93%9C.png',
  '/%EB%A7%B5/%EB%A9%94%ED%83%88%20%EC%97%A0%ED%8C%8C%EC%9D%B4%EC%96%B4.png',
  '/%EB%A7%B5/%EB%AC%B4%ED%95%9C%EC%82%B0.png',
  '/%EB%A7%B5/%EB%AF%B8%ED%95%98%EB%9D%BC%EC%8B%9C%20%EC%82%B0.png',
  '/%EB%A7%B5/%EB%B6%80%ED%8A%B8%20%ED%99%94%EC%82%B0.png',
  '/%EB%A7%B5/%EB%B9%84%ED%8B%80%EB%9E%9C%EB%93%9C.png',
  '/%EB%A7%B5/%EC%82%AC%EA%B7%9C%EC%82%B0.png',
  '/%EB%A7%B5/%EC%84%A0%EA%B3%B5%EA%B3%84.png',
  '/%EB%A7%B5/%EC%84%BC%ED%8A%B8%EB%9F%B4%20%ED%83%80%EC%9A%B4.png',
  '/%EB%A7%B5/%EC%8B%9C%EC%9E%91%EC%9D%98%EB%A7%88%EC%9D%84.png',
  '/%EB%A7%B5/%EC%93%B0%EB%A0%88%EA%B8%B0%EC%9D%98%20%EC%82%B0.png',
  '/%EB%A7%B5/%EC%95%84%EC%8B%9C%EB%85%B8%20%EC%84%AC.png',
  '/%EB%A7%B5/%EC%95%84%EC%9D%B4%EC%8A%A4%20%EC%83%9D%EC%B8%84%EC%96%B4%EB%A6%AC.png',
  '/%EB%A7%B5/%EC%96%B4%EB%B9%84%EC%8A%A4%20%EC%97%90%EB%A6%AC%EC%96%B4.png',
  '/%EB%A7%B5/%EC%96%B4%EC%85%88%EB%B8%94%EB%9F%AC%20%ED%83%80%EC%9B%8C.png',
  '/%EB%A7%B5/%EC%98%A4%EB%B2%84%EB%8D%B8%20%EB%AC%98%EC%A7%80.png',
  '/%EB%A7%B5/%EC%9A%A9%EC%9D%98%EB%88%88%ED%98%B8%EC%88%98.png',
  '/%EB%A7%B5/%EC%9A%A9%EC%A0%95%EA%B6%81.png',
  '/%EB%A7%B5/%EC%9C%88%EB%93%9C%20%EA%B0%80%EB%94%94%EC%96%B8%EC%A6%88.png',
  '/%EB%A7%B5/%EC%9D%B4%EB%B8%94%20%ED%8F%AC%EB%A0%88%EC%8A%A4%ED%8A%B8.png',
  '/%EB%A7%B5/%EC%A7%80%ED%95%98%20%ED%95%98%EC%88%98%EB%8F%84.png',
  '/%EB%A7%B5/%EC%BD%94%EB%8D%B1%20%EC%9C%A0%EC%A0%81.png',
  '/%EB%A7%B5/%EC%BD%94%EC%A6%88%EB%AF%B9%20%EC%97%90%EB%A6%AC%EC%96%B4.png',
  '/%EB%A7%B5/%EC%BD%94%ED%80%B4%ED%86%A0%EC%8A%A4.png',
  '/%EB%A7%B5/%ED%8C%A9%ED%86%A0%EB%A6%AC%EC%96%BC%20%EC%97%90%EB%A6%AC%EC%96%B4.png',
  '/%EB%A7%B5/%ED%99%A9%EA%B8%88%ED%96%A5.png',
  '/%EB%A7%B5/%ED%99%A9%EC%B2%9C.png',
]

const MAP_ROTATION_MS = 9000
const MAP_FADE_MS = 2600

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

const getRandomMapIndex = (currentIndex = -1) => {
  if (mapBackgrounds.length <= 1) {
    return 0
  }

  let nextIndex = currentIndex

  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * mapBackgrounds.length)
  }

  return nextIndex
}

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
  const [screenMode, setScreenMode] = useState('menu')
  const [selectedGrowthIndex, setSelectedGrowthIndex] = useState(0)
  const [mapTransition, setMapTransition] = useState(() => {
    const initialIndex = getRandomMapIndex()

    return {
      activeIndex: initialIndex,
      previousIndex: initialIndex,
      isFading: false,
    }
  })

  useEffect(() => {
    if (mapTransition.isFading) {
      return undefined
    }

    const rotationId = window.setTimeout(() => {
      setMapTransition((current) => ({
        previousIndex: current.activeIndex,
        activeIndex: getRandomMapIndex(current.activeIndex),
        isFading: true,
      }))
    }, MAP_ROTATION_MS)

    return () => {
      window.clearTimeout(rotationId)
    }
  }, [mapTransition.activeIndex, mapTransition.isFading])

  useEffect(() => {
    if (!mapTransition.isFading) {
      return undefined
    }

    const fadeId = window.setTimeout(() => {
      setMapTransition((current) => ({
        ...current,
        previousIndex: current.activeIndex,
        isFading: false,
      }))
    }, MAP_FADE_MS)

    return () => {
      window.clearTimeout(fadeId)
    }
  }, [mapTransition.activeIndex, mapTransition.isFading])

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

  const handleMenuAction = (actionKey) => {
    if (actionKey === 'new-game') {
      setScreenMode('new-game')
    }
  }

  const selectedGrowthDigimon = growthStageDigimon[selectedGrowthIndex]
  const baseBackgroundUrl = mapBackgrounds[
    mapTransition.isFading ? mapTransition.previousIndex : mapTransition.activeIndex
  ]
  const nextBackgroundUrl = mapBackgrounds[mapTransition.activeIndex]

  return (
    <main className="main-screen">
      <div
        className="main-screen__background main-screen__background--base"
        aria-hidden="true"
        style={{ backgroundImage: `url("${baseBackgroundUrl}")` }}
      />
      <div
        className={[
          'main-screen__background',
          'main-screen__background--next',
          mapTransition.isFading ? 'main-screen__background--visible' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden="true"
        style={{ backgroundImage: `url("${nextBackgroundUrl}")` }}
      />
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

      {screenMode === 'menu' && (
        <header className="title-band">
          <div className="title-band__inner">
            <img className="title-band__logo" src="/Title.png" alt="DigiRogue" />
          </div>
        </header>
      )}

      <section className="playfield">
        <div className="playfield__scanline" aria-hidden="true" />

        <div
          className={[
            'playfield__content',
            screenMode === 'new-game' ? 'playfield__content--selection' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {screenMode === 'menu' ? (
            <aside className="menu-panel">
              <nav className="menu-panel__list" aria-label={'\uBA54\uC778 \uBA54\uB274'}>
                {menuItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={[
                      'menu-item',
                      item.key === 'new-game' ? 'menu-item--current' : '',
                      item.disabled ? 'menu-item--disabled' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    disabled={item.disabled}
                    onClick={() => handleMenuAction(item.key)}
                  >
                    <span className="menu-item__marker" aria-hidden="true">
                      {item.key === 'new-game' ? '\u25B6' : ''}
                    </span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </aside>
          ) : (
            <section className="selection-screen" aria-label={'\uC131\uC7A5\uAE30 \uC120\uD0DD'}>
              <div className="selection-preview">
                <div className="selection-preview__top">
                  <button
                    type="button"
                    className="selection-back"
                    onClick={() => setScreenMode('menu')}
                  >
                    {'\u25C0 \uB4A4\uB85C'}
                  </button>
                  <div className="selection-preview__title-group">
                    <p className="selection-label">{'\uD604\uC7AC \uC131\uC7A5\uAE30'}</p>
                    <h2 className="selection-name">{selectedGrowthDigimon.name}</h2>
                  </div>
                </div>

                <div className="selection-preview__frame">
                  <img
                    className="selection-preview__image"
                    src={selectedGrowthDigimon.url}
                    alt={selectedGrowthDigimon.name}
                  />
                </div>
              </div>

              <div className="selection-gallery">
                <div className="selection-gallery__header">
                  <p className="selection-label">{'\uC131\uC7A5\uAE30 \uBAA9\uB85D'}</p>
                  <p className="selection-count">
                    {selectedGrowthIndex + 1}/{growthStageDigimon.length}
                  </p>
                </div>

                <div className="selection-grid">
                  {growthStageDigimon.map((digimon, index) => (
                    <button
                      key={digimon.url}
                      type="button"
                      className={[
                        'selection-card',
                        index === selectedGrowthIndex ? 'selection-card--active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setSelectedGrowthIndex(index)}
                      aria-pressed={index === selectedGrowthIndex}
                    >
                      <img
                        className="selection-card__image"
                        src={digimon.url}
                        alt={digimon.name}
                      />
                      <span className="selection-card__name">{digimon.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  )
}

export default App
