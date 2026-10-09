import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { buildEggEvolutionGraph, buildUnlinkedEvolutionGraph, getDexNodeDisplay,
  getDexRelatedEdges, layoutDigimonDex } from '../layout/digimonDexLayout.js'
import './DigimonDex.css'

const OTHER_FAMILY = 'other-families'
const DEFAULT_ZOOM = 0.8
const clampZoom = value => Math.max(0.5, Math.min(1.5, Math.round(value * 10) / 10))

export default function DigimonDex({ eggs, lookup, collection, onBack }) {
  const [familyId, setFamilyId] = useState(eggs[0]?.이름 ?? OTHER_FAMILY)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [hoveredId, setHoveredId] = useState(null)
  const [focusedId, setFocusedId] = useState(null)
  const [dragging, setDragging] = useState(false)
  const viewportRef = useRef(null), backRef = useRef(null), dragRef = useRef(null)
  const nodeRefs = useRef(new Map()), zoomScrollRef = useRef(null)
  const otherGraph = useMemo(() => buildUnlinkedEvolutionGraph(eggs, lookup), [eggs, lookup])
  const egg = eggs.find(item => item.이름 === familyId)
  const graph = useMemo(() => egg ? buildEggEvolutionGraph(egg, lookup) : otherGraph, [egg, lookup, otherGraph])
  const layout = useMemo(() => layoutDigimonDex(graph), [graph])
  const portraits = useMemo(() => layout.nodes.map(node => ({ ...node, display: getDexNodeDisplay(node, collection) })), [layout, collection])
  const activeId = hoveredId ?? focusedId
  const relatedEdges = useMemo(() => getDexRelatedEdges(graph, activeId), [graph, activeId])
  const relatedNodes = useMemo(() => relatedEdges ? new Set([activeId, ...graph.edges
    .filter(edge => relatedEdges.has(edge.id)).flatMap(edge => [edge.from, edge.to])]) : null, [graph, relatedEdges, activeId])
  const title = egg ? egg.이름 + '의 디지에그' : '기타 계통'

  useEffect(() => {
    backRef.current?.focus({ preventScroll: true })
  }, [])
  useEffect(() => {
    const onKeyDown = event => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onBack()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onBack])
  useLayoutEffect(() => {
    if (!viewportRef.current) return
    viewportRef.current.scrollLeft = 0
    viewportRef.current.scrollTop = 0
  }, [familyId])
  useLayoutEffect(() => {
    const pending = zoomScrollRef.current, viewport = viewportRef.current
    if (!pending || !viewport) return
    viewport.scrollLeft = pending.x * zoom - viewport.clientWidth / 2
    viewport.scrollTop = pending.y * zoom - viewport.clientHeight / 2
    zoomScrollRef.current = null
  }, [zoom])

  const selectFamily = id => {
    viewportRef.current?.scrollTo({ left: 0, top: 0 })
    setFamilyId(id); setZoom(DEFAULT_ZOOM); setHoveredId(null); setFocusedId(null)
    zoomScrollRef.current = null
  }
  const changeZoom = value => {
    const next = clampZoom(value), viewport = viewportRef.current
    if (next === zoom || !viewport) return
    zoomScrollRef.current = {
      x: (viewport.scrollLeft + viewport.clientWidth / 2) / zoom,
      y: (viewport.scrollTop + viewport.clientHeight / 2) / zoom,
    }
    setZoom(next)
  }
  const resetView = () => {
    zoomScrollRef.current = null
    setZoom(DEFAULT_ZOOM)
    viewportRef.current?.scrollTo({ left: 0, top: 0 })
  }
  const moveFocus = (event, node) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault(); event.stopPropagation()
    const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight'
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    const axis = horizontal ? 'x' : 'y', cross = horizontal ? 'y' : 'x'
    const candidates = layout.nodes.filter(other => (forward ? other[axis] > node[axis] : other[axis] < node[axis]))
    candidates.sort((a, b) =>
      Math.abs(a[axis] - node[axis]) + Math.abs(a[cross] - node[cross]) * 2 -
      Math.abs(b[axis] - node[axis]) - Math.abs(b[cross] - node[cross]) * 2)
    const target = nodeRefs.current.get(candidates[0]?.id)
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }
  const startDrag = event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('.dex-node')) return
    const viewport = viewportRef.current
    dragRef.current = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
  }
  const endDrag = event => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    setDragging(false)
  }

  return (
    <section className="dex-screen" aria-label="디지몬 도감">
      <header className="dex-header">
        <button ref={backRef} type="button" className="dex-back" onClick={onBack}>◀ 뒤로</button>
        <div className="dex-header__title"><span>DIGIMON ARCHIVE</span><h1>디지몬 도감</h1></div>
      </header>
      <div className="dex-body">
        <nav className="dex-families" aria-label="디지에그 계통 선택">
          {eggs.map(item => (
            <button type="button" key={item.이름} className={'dex-family' + (familyId === item.이름 ? ' dex-family--active' : '')}
              aria-pressed={familyId === item.이름} onClick={() => selectFamily(item.이름)}>
              <img src={'/아이템/디지에그/' + item.이름 + '.png'} alt="" width="40" height="40" draggable="false" />
              <span>{item.이름}</span><span className="dex-family__arrow" aria-hidden="true">›</span>
            </button>
          ))}
          {otherGraph.nodes.length > 0 && (
            <button type="button" className={'dex-family dex-family--other' + (familyId === OTHER_FAMILY ? ' dex-family--active' : '')}
              aria-pressed={familyId === OTHER_FAMILY} onClick={() => selectFamily(OTHER_FAMILY)}>
              <span className="dex-family__symbol" aria-hidden="true">◇</span><span>기타 계통</span><span className="dex-family__arrow" aria-hidden="true">›</span>
            </button>
          )}
        </nav>
        <div className="dex-chart">
          <header className="dex-chart__toolbar">
            <h2>{title}</h2>
            <div className="dex-zoom" role="group" aria-label="도감 확대와 축소">
              <button type="button" aria-label="축소" onClick={() => changeZoom(zoom - 0.1)} disabled={zoom <= 0.5}>−</button>
              <output aria-label="확대 비율">{Math.round(zoom * 100)}%</output>
              <button type="button" aria-label="확대" onClick={() => changeZoom(zoom + 0.1)} disabled={zoom >= 1.5}>+</button>
              <button type="button" className="dex-zoom__reset" aria-label="처음 위치와 크기로" title="처음 위치와 크기로" onClick={resetView}>↺</button>
            </div>
          </header>
          <div ref={viewportRef} className={'dex-viewport' + (dragging ? ' dex-viewport--dragging' : '')}
            role="region" tabIndex="0" aria-label={title + ' 진화 계통도'}
            onPointerDown={startDrag} onPointerMove={event => {
              const drag = dragRef.current
              if (!drag) return
              viewportRef.current.scrollLeft = drag.left - (event.clientX - drag.x)
              viewportRef.current.scrollTop = drag.top - (event.clientY - drag.y)
            }} onPointerUp={endDrag} onPointerCancel={endDrag}>
            <div className="dex-canvas-space" style={{ width: layout.width * zoom, height: layout.height * zoom }}>
              <div className="dex-canvas" style={{ width: layout.width, height: layout.height, transform: 'scale(' + zoom + ')' }}>
                <svg className="dex-connections" width={layout.width} height={layout.height} aria-hidden="true">
                  {layout.edges.map(edge => (
                    <path key={edge.id} d={edge.path} className={[
                      'dex-connection', !edge.primary ? 'dex-connection--merge' : '',
                      relatedEdges ? (relatedEdges.has(edge.id) ? 'dex-connection--active' : 'dex-connection--dim') : '',
                    ].filter(Boolean).join(' ')} />
                  ))}
                </svg>
                {portraits.map(node => (
                  <button type="button" key={node.id} className={[
                    'dex-node', node.kind === 'egg' ? 'dex-node--egg' : '',
                    !node.display.known ? 'dex-node--unknown' : '',
                    activeId === node.id ? 'dex-node--active' : '',
                    relatedNodes && !relatedNodes.has(node.id) ? 'dex-node--dim' : '',
                  ].filter(Boolean).join(' ')}
                    style={{ left: node.x, top: node.y, width: node.size, height: node.size }}
                    ref={element => { if (element) nodeRefs.current.set(node.id, element); else nodeRefs.current.delete(node.id) }}
                    tabIndex={node.id === (focusedId ?? graph.rootId) ? 0 : -1}
                    aria-label={node.display.label} title={node.display.known ? node.display.label : undefined}
                    onMouseEnter={() => setHoveredId(node.id)} onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setFocusedId(node.id)} onBlur={() => setFocusedId(null)} onKeyDown={event => moveFocus(event, node)}>
                    {node.display.known
                      ? <img src={node.display.imageUrl} alt={node.display.label} loading="lazy" decoding="async" width="92" height="92" draggable="false" />
                      : <span className="dex-node__question" aria-hidden="true">?</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
