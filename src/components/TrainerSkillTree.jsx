import { useEffect, useId, useRef, useState } from 'react'
import { TRAINER_CATEGORIES, TRAINER_SKILLS, TRAINER_SKILL_LOOKUP, TRAINER_STATS,
  getTrainerPoints, getTrainerLearnBlocker, getTrainerSkillPrice } from '../progression/trainerSkills.js'
import { layoutTrainerSkills } from '../layout/trainerSkillLayout.js'
import './TrainerSkillTree.css'
import ItemLuck from './ItemLuck.jsx'
import TrainerReset from './TrainerReset.jsx'
import TrainerSkillTooltip from './TrainerSkillTooltip.jsx'

function SkillGlyph({ kind = 'bond' }) {
  const paths = {
    bond: 'M12 3 21 9v9l-9 5-9-5V9z M3 9l9 5 9-5 M12 14v9',
    budget: 'M4 8h18v12H4z M9 8V4h8v4 M13 11v6 M10 14h6',
    attack: 'm5 21 14-14 2-5-5 2L2 18 M5 14l7 7 M3 19l3 3',
    defense: 'm12 3 9 3v7c0 5-9 10-9 10S3 18 3 13V6z M12 7v11',
    specialAttack: 'm12 2 2 7 8 3-8 3-2 8-2-8-8-3 8-3z',
    specialDefense: 'm12 3 9 3v7c0 5-9 10-9 10S3 18 3 13V6z M8 12l3 3 5-6',
    hp: 'M12 21 3 12C-1 5 7 1 12 7c5-6 13-2 9 5z',
    speed: 'm14 2-9 12h7l-2 10 11-14h-8z',
    boss: 'm3 8 4 4 5-8 5 8 4-4-2 12H5z M8 23h8',
    item: 'M4 8h18v13H4z M2 5h22v5H2z M13 5v16 M13 5C4 5 6-2 10 1l3 4c8 0 7-7 3-4z',
    exp: 'M3 18h5v5H3z M10 12h5v11h-5z M17 6h5v17h-5z M3 10l17-8 M16 2h5v5',
    scan: 'M3 9V3h6 M17 3h6v6 M23 17v6h-6 M9 23H3v-6 M8 8h10v10H8z M10 13h6 M13 10v6',
    root: 'm13 2 3 7 8 1-6 6 1 8-6-4-7 4 2-8-6-6 8-1z',
    cost: 'm12 3 9 6v9l-9 5-9-5V9z M8 14h8',
    stat: 'M3 20V6 M3 20h20 M6 16l5-6 5 3 6-9',
    evolution: 'm3 18 5-5 5 5 10-13 M16 5h7v7 M5 23h16',
    memory: 'M5 3h16v20H5z M8 7h10 M8 11h7 M10 18l3 3 6-7',
    luck: 'M13 13C0 13 2 0 10 4l3 5c0-13 13-11 9-3l-5 7c13 0 11 13 3 9l-7-5c0 13-13 11-9 3l5-7 M13 13l-3 10',
  }
  return <svg viewBox="0 0 26 26" aria-hidden="true"><path d={paths[kind] ?? paths.bond} /></svg>
}

const defaultTab = category => category === 'stats' ? 'hp' : category === 'growth' ? 'exp' : ''

export default function TrainerSkillTree({ progress, onLearn, onBack, onReset }) {
  const [category, setCategory] = useState('cost')
  const [tab, setTab] = useState('')
  const [selectedId, setSelectedId] = useState('cost-budget-1')
  const [feedback, setFeedback] = useState('')
  const [tooltip, setTooltip] = useState(null)
  const tooltipId = useId()
  const backRef = useRef(null), nodeRefs = useRef(new Map()), tabsRef = useRef([])
  const viewportRef = useRef(null)
  useEffect(() => { backRef.current?.focus() }, [])
  useEffect(() => { viewportRef.current?.scrollTo({ left: 0, top: 0 }) }, [category, tab])
  useEffect(() => {
    const key = event => { if (event.key === 'Escape') { event.preventDefault(); onBack() } }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onBack])
  const { nodes, width: graphWidth, height: graphHeight } = layoutTrainerSkills(category, tab)
  const tooltipNode = nodes.find(node => node.id === tooltip?.id)
  const selected = TRAINER_SKILL_LOOKUP[selectedId] ?? nodes[0]
  const rank = progress.learned[selected.id] ?? 0
  const price = getTrainerSkillPrice(selected, rank)
  const rankCosts = selected.rankCosts.map((cost, index) => index < rank ? progress.paid?.[selected.id]?.[index] ?? cost : cost)
  const blocker = getTrainerLearnBlocker(progress, selected.id)
  const points = getTrainerPoints(progress)
  const chooseCategory = id => {
    const nextTab = defaultTab(id)
    setCategory(id); setTab(nextTab); setFeedback(''); setTooltip(null)
    setSelectedId(TRAINER_SKILLS.find(node => node.category === id && node.price && (!node.tab || node.tab === nextTab)).id)
  }
  const selectNode = node => {
    if (node.category !== category || (node.tab && node.tab !== tab)) {
      setCategory(node.category); setTab(node.tab ?? defaultTab(node.category))
    }
    setSelectedId(node.id); setFeedback('')
  }
  const learn = () => {
    const result = onLearn(selected.id)
    setFeedback(result.ok ? `${selected.name} ${result.progress.learned[selected.id]}단계를 배웠습니다. · ${result.price} SP 사용` : result.error)
  }
  const moveNode = (event, node) => {
    if (event.key === 'Escape' && tooltip) {
      event.preventDefault(); event.stopPropagation(); setTooltip(null)
      return
    }
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]
    if (!direction) return
    event.preventDefault()
    const [dx, dy] = direction
    const next = nodes.filter(candidate => candidate.id !== node.id && (candidate.x - node.x) * dx + (candidate.y - node.y) * dy > 0)
      .sort((a, b) => Math.hypot(a.x - node.x, a.y - node.y) + Math.abs((a.x - node.x) * dy - (a.y - node.y) * dx) * 2 -
        Math.hypot(b.x - node.x, b.y - node.y) - Math.abs((b.x - node.x) * dy - (b.y - node.y) * dx) * 2)[0]
    if (next) { selectNode(next); nodeRefs.current.get(next.id)?.focus() }
  }
  const groupLabels = { budget: '팀 코스트 한도 · 공통 교감', general: category === 'items' ? '행운 훈련' : tab === 'evolution' ? '진화 훈련' : '공통 훈련',
    stage: '진화 단계', attribute: '속성', type: '종족 · 타입' }
  const tabs = category === 'stats' ? [...Object.entries(TRAINER_STATS), ['evolution', '진화'], ['boss', '보스 피해']] :
    category === 'growth' ? [['exp', '경험치'], ['scan', '스캔율']] : []
  return <section className="trainer-skills" aria-label="테이머 스킬">
    <header className="trainer-skills__header">
      <button ref={backRef} type="button" className="trainer-skills__back" onClick={onBack}>◀ 뒤로</button>
      <div><p>TAMER SKILLS</p><h1>테이머 스킬</h1></div>
      <TrainerReset progress={progress} onReset={onReset} />
      <div className="trainer-skills__points"><SkillGlyph kind="root" /><span>스킬 포인트<strong>{points}<small> SP</small></strong></span></div>
    </header>
    <div className="trainer-skills__body">
      <aside className="trainer-skills__sidebar">
        <nav role="tablist" aria-label="스킬 분류" className="trainer-skills__categories" aria-orientation="vertical">
          {TRAINER_CATEGORIES.map((item, index) => {
            const ranks = TRAINER_SKILLS.filter(node => node.category === item.id && node.price)
            const learned = ranks.reduce((sum, node) => sum + (progress.learned[node.id] ?? 0), 0)
            const maximum = ranks.reduce((sum, node) => sum + node.maxRank, 0)
            return <button type="button" key={item.id} role="tab" aria-selected={category === item.id}
              aria-controls="trainer-skill-network" id={`trainer-category-${item.id}`} tabIndex={category === item.id ? 0 : -1}
              ref={element => { tabsRef.current[index] = element }} title={item.subtitle} onClick={() => chooseCategory(item.id)}
              onKeyDown={event => {
                const offset = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0
                if (!offset) return
                event.preventDefault()
                const next = (index + offset + TRAINER_CATEGORIES.length) % TRAINER_CATEGORIES.length
                chooseCategory(TRAINER_CATEGORIES[next].id); tabsRef.current[next]?.focus()
              }}>
              <SkillGlyph kind={item.icon} /><span>{item.name}<small>{item.subtitle}</small></span><b>{learned}<small>/{maximum}</small></b>
            </button>
          })}
        </nav>
        <section className="trainer-skills__detail" aria-label="선택한 스킬">
          <div className="trainer-skills__detail-body">
          <div className={`trainer-skills__detail-icon${rank ? ' is-learned' : ''}`}><SkillGlyph kind={selected.icon} /></div>
          <p className="trainer-skills__eyebrow">{selected.group === 'root' ? '기본 해금' : `${rank} / ${selected.maxRank} 단계`}</p>
          <h2>{selected.name}</h2><p className="trainer-skills__description">{selected.description}</p>
          <div className="trainer-skills__ranks" aria-label={`${rank}단계, 최대 ${selected.maxRank}단계`}>
            {Array.from({ length: selected.maxRank }, (_, index) => <i key={index} className={index < rank ? 'is-learned' : ''} />)}
          </div>
          {selected.requires.length > 0 && <p className="trainer-skills__requirements">선행 스킬: {selected.requires.map(required =>
            <button type="button" key={required.id} onClick={() => selectNode(TRAINER_SKILL_LOOKUP[required.id])}>
              {TRAINER_SKILL_LOOKUP[required.id].name} {required.rank}단계{(progress.learned[required.id] ?? 0) >= required.rank ? ' ✓' : ''}
            </button>)}</p>}
          </div>
          {selected.price > 0 && <div className="trainer-skills__rank-costs" role="group" aria-label="단계별 필요 포인트">
            <span>단계별 SP</span><ol>{rankCosts.map((cost, index) =>
              <li key={index} className={index < rank ? 'is-learned' : index === rank ? 'is-next' : ''}
                aria-label={`${index + 1}단계 ${cost} SP${index < rank ? ', 습득 완료' : index === rank ? ', 다음 단계' : ''}`}>
                <small>{index + 1}</small><b>{cost}</b>
              </li>)}</ol>
          </div>}
          <button className="trainer-skills__learn" type="button" onClick={learn} disabled={Boolean(blocker)}>
            {rank >= selected.maxRank ? '습득 완료' : <><span>{rank ? '다음 단계 배우기' : '스킬 배우기'}</span><b>{price} SP</b></>}
          </button>
          <p className="trainer-skills__feedback" role="status" aria-live="polite">{feedback || blocker || '연결된 스킬을 배워 나만의 팀을 키워보세요.'}</p>
        </section>
      </aside>
      <section className="trainer-skills__network-panel">
        <div className="trainer-skills__network-heading"><div><h2>{TRAINER_CATEGORIES.find(item => item.id === category).name}</h2>
          <span>스킬을 선택해 효과와 필요 포인트를 확인하세요.</span></div>
          <div className="trainer-skills__legend"><span className="is-learned">습득</span><span className="is-available">해금</span><span>잠김</span></div>
        </div>
        {category === 'items' && <ItemLuck ranks={progress.learned} expanded />}
        {tabs.length > 0 && <div className="trainer-skills__filters" aria-label="스킬 세부 분류">{tabs.map(([id, label]) =>
          <button type="button" key={id} aria-pressed={tab === id} onClick={() => {
            setTab(id); setFeedback(''); setTooltip(null); setSelectedId(TRAINER_SKILLS.find(node => node.category === category && node.tab === id).id)
          }}>{label}</button>)}</div>}
        <div className="trainer-skills__viewport" ref={viewportRef} id="trainer-skill-network" role="tabpanel"
          aria-labelledby={`trainer-category-${category}`} tabIndex={0}>
          <div className="trainer-skills__graph" style={{ height: graphHeight }}>
            <svg className="trainer-skills__connections" viewBox={`0 0 ${graphWidth} ${graphHeight}`} aria-hidden="true">
              {nodes.flatMap(node => node.requires.map(required => {
                const source = nodes.find(candidate => candidate.id === required.id)
                if (!source) return null
                const live = (progress.learned[required.id] ?? 0) >= required.rank
                const learned = (progress.learned[node.id] ?? 0) > 0
                const trunkX = source.group === 'root' ? 148 : source.x + 42
                const startX = source.x + (source.group === 'root' ? 40.5 : 26.5)
                const endX = node.x - 26.5
                const path = source.anchorY === node.anchorY ? `M${startX} ${source.anchorY}H${endX}` :
                  `M${startX} ${source.anchorY}H${trunkX}V${node.anchorY}H${endX}`
                return <path key={`${node.id}-${required.id}`} d={path} className={learned ? 'is-learned' : live ? 'is-available' : ''} />
              }))}
            </svg>
            {Object.entries(groupLabels).map(([group, label]) => {
              const row = nodes.filter(node => node.group === group)
              return row.length > 0 && <span className="trainer-skills__branch-label" key={group}
                style={{ left: 196, top: Math.min(...row.map(node => node.y)) - 72 }}>{label}</span>
            })}
            {nodes.map(node => {
              const learnedRank = progress.learned[node.id] ?? 0
              const complete = learnedRank >= node.maxRank
              const nextPrice = getTrainerSkillPrice(node, learnedRank)
              const available = node.requires.every(required => (progress.learned[required.id] ?? 0) >= required.rank)
              return <button type="button" key={node.id} style={{ left: node.x, top: node.y }}
                ref={element => { if (element) nodeRefs.current.set(node.id, element); else nodeRefs.current.delete(node.id) }}
                className={['trainer-skill-node', learnedRank ? 'is-learned' : available ? 'is-available' : 'is-locked',
                  selected.id === node.id ? 'is-selected' : '', node.group === 'root' ? 'is-root' : ''].filter(Boolean).join(' ')}
                aria-label={`${node.name}, ${learnedRank}/${node.maxRank}단계, ${available ? '해금' : '잠김'}, ${complete ? '습득 완료' : `${nextPrice} SP`}`}
                aria-pressed={selected.id === node.id} aria-describedby={tooltipNode?.id === node.id ? tooltipId : undefined}
                onPointerEnter={event => { if (event.pointerType !== 'touch') setTooltip({ id: node.id, anchor: event.currentTarget }) }}
                onPointerLeave={() => setTooltip(null)}
                onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setTooltip({ id: node.id, anchor: event.currentTarget }) }}
                onBlur={() => setTooltip(null)}
                onClick={() => selectNode(node)} onKeyDown={event => moveNode(event, node)}>
                <span className="trainer-skill-node__tile"><SkillGlyph kind={node.icon} />
                  <span className="trainer-skill-node__price">{complete ? '✓' : `${nextPrice} SP`}</span>
                </span>
                <span className="trainer-skill-node__name">{node.label ?? node.name}</span>
                <span className="trainer-skill-node__rank">{learnedRank}/{node.maxRank}</span>
              </button>
            })}
          </div>
        </div>
        <footer className="trainer-skills__footer"><span>배운 스킬은 새 모험부터 적용됩니다.</span>
          <span>{category === 'cost' ? '개별 코스트 최저 1 · 팀 한도 최대 25' : '방향키로 스킬 이동 · Enter로 선택'}</span></footer>
      </section>
    </div>
    {tooltipNode && <TrainerSkillTooltip id={tooltipId} anchor={tooltip.anchor} node={tooltipNode} progress={progress} />}
  </section>
}
