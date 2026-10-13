import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { buildEggEvolutionGraph, getDexNodeDisplay,
  getDexRelatedEdges, layoutDigimonDex } from '../layout/digimonDexLayout.js'
import ItemDex from './ItemDex.jsx'
import './DigimonDex.css'

const DEFAULT_ZOOM = 0.8
// Reserve leading space so a root near the left edge can still be centered
// without asking the browser for a negative scrollLeft.
const chartRootCenter = (layout, zoom) => {
  const root = layout.nodes.find(node => node.kind === 'egg') ?? layout.nodes[0]
  return root ? (root.x + root.size / 2) * zoom : 0
}
const chartOffset = (layout, zoom, viewport) => Math.max(0, viewport.clientWidth / 2 - chartRootCenter(layout, zoom))
const clampZoom = value => Math.max(0.5, Math.min(1.5, Math.round(value * 10) / 10))

export default function DigimonDex({ eggs, lookup, collection, items = [], onBack }) {
  const [tab, setTab] = useState('digimon')
  const archiveId = useId()
  const tabRefs = useRef({})
  const selectTab = next => { setTab(next); tabRefs.current[next]?.focus() }
  const navigateTabs = event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    selectTab(event.key === 'Home' ? 'digimon' : event.key === 'End' ? 'items' : tab === 'digimon' ? 'items' : 'digimon')
  }
  const [familyId, setFamilyId] = useState(eggs[0]?.이름 ?? '')
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [hoveredId, setHoveredId] = useState(null)
  const [focusedId, setFocusedId] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [expandedIds, setExpandedIds] = useState(null)
  const viewportRef = useRef(null), backRef = useRef(null), dragRef = useRef(null)
  const nodeRefs = useRef(new Map()), zoomScrollRef = useRef(null), branchScrollRef = useRef(null)
  const egg = eggs.find(item => item.이름 === familyId)
  const graph = useMemo(() => egg ? buildEggEvolutionGraph(egg, lookup) : { nodes: [], edges: [] }, [egg, lookup])
  const fullLayout = useMemo(() => layoutDigimonDex(graph), [graph])
  const fullNodes = useMemo(() => new Map(fullLayout.nodes.map(node => [node.id, node])), [fullLayout])
  const initialExpandedIds = useMemo(() => new Set(fullLayout.nodes
    .filter(node => !node.referenceTo).map(node => node.id)), [fullLayout])
  const expanded = expandedIds ?? initialExpandedIds
  const layout = useMemo(() => layoutDigimonDex(graph, { expandedIds: expanded }), [graph, expanded])
  const portraits = useMemo(() => layout.nodes.map(node => ({ ...node, display: getDexNodeDisplay(node, collection) })), [layout, collection])
  const activeId = hoveredId ?? focusedId
  const activeSourceId = fullNodes.get(activeId)?.sourceId
  const relatedEdges = useMemo(() => getDexRelatedEdges(graph, activeSourceId), [graph, activeSourceId])
  const relatedNodes = useMemo(() => relatedEdges ? new Set([activeSourceId, ...graph.edges
    .filter(edge => relatedEdges.has(edge.id)).flatMap(edge => [edge.from, edge.to])]) : null, [graph, relatedEdges, activeSourceId])
  const title = egg ? egg.이름 + '의 디지에그' : '디지에그'

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
    const root = layout.nodes.find(node => node.id === graph.rootId) ?? layout.nodes[0]
    viewportRef.current.scrollLeft = root ? chartOffset(layout, DEFAULT_ZOOM, viewportRef.current) + (root.x + root.size / 2) * DEFAULT_ZOOM - viewportRef.current.clientWidth / 2 : 0
    viewportRef.current.scrollTop = 0
  }, [familyId])
  useLayoutEffect(() => {
    const pending = zoomScrollRef.current, viewport = viewportRef.current
    if (!pending || !viewport) return
    viewport.scrollLeft = chartOffset(layout, zoom, viewport) + pending.x * zoom - viewport.clientWidth / 2
    viewport.scrollTop = pending.y * zoom - viewport.clientHeight / 2
    zoomScrollRef.current = null
  }, [zoom])

  useLayoutEffect(() => {
    const pending = branchScrollRef.current, viewport = viewportRef.current
    if (!pending || !viewport) return
    const node = layout.nodes.find(node => node.id === pending.id)
    if (node) {
      viewport.scrollLeft = chartOffset(layout, zoom, viewport) + (node.x + node.size / 2) * zoom - (pending.center ? viewport.clientWidth / 2 : pending.x)
      viewport.scrollTop = pending.top ? 0 : (node.y + node.size / 2) * zoom - (pending.center ? viewport.clientHeight / 2 : pending.y)
      if (pending.center) nodeRefs.current.get(node.id)?.focus({ preventScroll: true })
    }
    branchScrollRef.current = null
  }, [layout, zoom])

  const selectFamily = id => {
    if (id === familyId) { resetView(); return }
    viewportRef.current?.scrollTo({ left: 0, top: 0 })
    setFamilyId(id); setZoom(DEFAULT_ZOOM); setHoveredId(null); setFocusedId(null); setExpandedIds(null)
    branchScrollRef.current = null
    zoomScrollRef.current = null
  }
  const changeZoom = value => {
    const next = clampZoom(value), viewport = viewportRef.current
    if (next === zoom || !viewport) return
    zoomScrollRef.current = {
      x: (viewport.scrollLeft + viewport.clientWidth / 2 - chartOffset(layout, zoom, viewport)) / zoom,
      y: (viewport.scrollTop + viewport.clientHeight / 2) / zoom,
    }
    setZoom(next)
  }
  const resetView = () => {
    zoomScrollRef.current = null
    setZoom(DEFAULT_ZOOM)
    branchScrollRef.current = null
    setExpandedIds(null); setHoveredId(null); setFocusedId(null)
    const root = fullNodes.get(graph.rootId) ?? fullLayout.nodes[0]
    // The default tree has its own width; recenter after restoring collapsed branches.
    branchScrollRef.current = root ? { id: root.id, center: true, top: true } : null
    if (expandedIds === null && zoom === DEFAULT_ZOOM) {
      const visibleRoot = layout.nodes.find(node => node.id === root?.id)
      if (visibleRoot && viewportRef.current) viewportRef.current.scrollTo({
        left: chartOffset(layout, DEFAULT_ZOOM, viewportRef.current) + (visibleRoot.x + visibleRoot.size / 2) * DEFAULT_ZOOM - viewportRef.current.clientWidth / 2,
        top: 0 })
      branchScrollRef.current = null
    }
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
  const toggleBranch = node => {
    const viewport = viewportRef.current
    if (!viewport || (!node.childCount && !node.referenceTo)) return
    const next = new Set(expanded)
    if (node.referenceTo) {
      let target = fullNodes.get(node.referenceTo)
      while (target) { next.add(target.id); target = fullNodes.get(target.parentId) }
      branchScrollRef.current = { id: node.referenceTo, center: true }
    } else {
      branchScrollRef.current = { id: node.id,
        x: chartOffset(layout, zoom, viewport) + (node.x + node.size / 2) * zoom - viewport.scrollLeft,
        y: (node.y + node.size / 2) * zoom - viewport.scrollTop }
      if (next.has(node.id)) next.delete(node.id)
      else next.add(node.id)
    }
    setHoveredId(null); setExpandedIds(next)
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
    <section className="dex-screen" aria-label="도감">
      <header className="dex-header">
        <button ref={backRef} type="button" className="dex-back" onClick={onBack}>◀ 뒤로</button>
        <div className="dex-header__title"><span>DIGITAL ARCHIVE</span><h1>도감</h1></div>
        <div className="dex-tabs" role="tablist" aria-label="도감 종류" onKeyDown={navigateTabs}>
          {[['digimon', '디지몬'], ['items', '아이템']].map(([key, label]) => (
            <button key={key} type="button" role="tab" id={archiveId + '-tab-' + key}
              aria-controls={archiveId + '-panel-' + key} aria-selected={tab === key} tabIndex={tab === key ? 0 : -1}
              ref={element => { tabRefs.current[key] = element }} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
      </header>
      <div className="dex-body" role="tabpanel" id={archiveId + '-panel-digimon'} aria-labelledby={archiveId + '-tab-digimon'} hidden={tab !== 'digimon'}>
        <nav className="dex-families" aria-label="디지에그 계통 선택">
          {eggs.map(item => (
            <button type="button" key={item.이름} className={'dex-family' + (familyId === item.이름 ? ' dex-family--active' : '')}
              aria-pressed={familyId === item.이름} onClick={() => selectFamily(item.이름)}>
              <img src={'/아이템/디지에그/' + item.이름 + '.png'} alt="" width="40" height="40" draggable="false" />
              <span>{item.이름}</span><span className="dex-family__arrow" aria-hidden="true">›</span>
            </button>
          ))}
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
            <div className="dex-canvas-space" style={{ width: layout.width * zoom, height: layout.height * zoom,
              marginLeft: 'max(0px, calc(50% - ' + chartRootCenter(layout, zoom) + 'px))' }}>
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
                    node.referenceTo ? 'dex-node--reference' : '',
                    !node.display.known ? 'dex-node--unknown' : '',
                    activeId === node.id ? 'dex-node--active' : '',
                    relatedNodes && !relatedNodes.has(node.sourceId) ? 'dex-node--dim' : '',
                  ].filter(Boolean).join(' ')}
                    style={{ left: node.x, top: node.y, width: node.size, height: node.size }}
                    ref={element => { if (element) nodeRefs.current.set(node.id, element); else nodeRefs.current.delete(node.id) }}
                    tabIndex={node.id === (focusedId ?? graph.rootId) ? 0 : -1}
                    aria-label={node.display.label} title={node.display.known ? node.display.label : undefined}
                    aria-expanded={node.childCount ? node.expanded : undefined}
                    aria-description={node.referenceTo ? '연결된 진화 가지로 이동합니다.' : node.childCount ? '다음 진화 가지를 펼치거나 접습니다.' : undefined}
                    onClick={() => toggleBranch(node)}
                    onMouseEnter={() => setHoveredId(node.id)} onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setFocusedId(node.id)} onBlur={() => setFocusedId(null)} onKeyDown={event => moveFocus(event, node)}>
                    {node.display.known
                      ? <img src={node.display.imageUrl} alt={node.display.label} loading="lazy" decoding="async" width="92" height="92" draggable="false" />
                      : <span className="dex-node__question" aria-hidden="true">?</span>}
                    {(node.childCount > 0 || node.referenceTo) && <span className="dex-node__branch" aria-hidden="true">
                      {node.referenceTo ? '↗' : node.expanded ? '−' : '+'}
                    </span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="dex-item-panel" role="tabpanel" id={archiveId + '-panel-items'} aria-labelledby={archiveId + '-tab-items'} hidden={tab !== 'items'}>
        <ItemDex catalog={items} collection={collection} />
      </div>
    </section>
  )
}
