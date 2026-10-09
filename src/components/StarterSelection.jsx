import { useEffect, useMemo, useRef, useState } from 'react'
import DigimonModelPreview from './DigimonModelPreview.jsx'
import PassiveAbility from './PassiveAbility.jsx'
import { getDigimonThumbnailUrl } from '../data/digimonModels.js'
import { STARTER_STAGES, STARTER_PARTY_COST_LIMIT, STARTER_TEAM_LIMIT, STARTING_PLAYER_LEVEL,
  filterStarterEntries, getStarterTeamSummary, getStarterSelectionBlocker, toggleStarterSelection } from '../data/starterSelection.js'
import { getTrainerStatMultiplier } from '../progression/trainerSkills.js'
import { getAnalysisProgress } from '../battle/digimonAnalysis.js'
import './StarterSelection.css'

const defaultStageFilters = ['전체', ...STARTER_STAGES]

export default function StarterSelection({ catalog, analysis = {}, trainerSkills = {}, selectedNames, onSelectionChange, getStartingSkills, getSkillDetails, onStart, onBack, blocked = false, modeControl, startDisabled = false, eyebrow = 'DIGITAL MONSTER INDEX', headerInfo, headerActions, children }) {
  const [stage, setStage] = useState('성장기')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('number')
  const [previewName, setPreviewName] = useState(selectedNames[0] ?? catalog.byStage.성장기[0]?.name ?? catalog.entries[0]?.name)
  const [feedback, setFeedback] = useState('')
  const previewTimer = useRef(null)
  const tabRefs = useRef([])
  const gridRef = useRef(null)
  const entries = useMemo(() => filterStarterEntries(catalog, { stage, query, sort }), [catalog, stage, query, sort])
  const preview = entries.find(entry => entry.name === previewName) ?? entries[0] ?? catalog.byName.get(previewName) ?? catalog.entries[0]
  const summary = getStarterTeamSummary(selectedNames, catalog)
  const costLimit = catalog.costLimit ?? STARTER_PARTY_COST_LIMIT
  const teamLimit = catalog.teamLimit ?? STARTER_TEAM_LIMIT
  const stageFilters = catalog.stageFilters ?? defaultStageFilters
  const selected = selectedNames.includes(preview?.name)
  const previewBlocker = getStarterSelectionBlocker(preview?.name, selectedNames, catalog)
  const unlocked = preview?.status === 'unlocked'
  const unknown = preview?.status === 'unknown'
  const skills = unlocked ? getStartingSkills(preview?.data, STARTING_PLAYER_LEVEL) : []
  const seenCount = catalog.entries.filter(entry => entry.status !== 'unknown').length
  const unlockedCount = catalog.entries.filter(entry => entry.status === 'unlocked').length

  useEffect(() => () => window.clearTimeout(previewTimer.current), [])
  useEffect(() => { gridRef.current?.scrollTo({ top: 0 }) }, [stage, query, sort])
  const cancelPreview = () => window.clearTimeout(previewTimer.current)
  const showPreview = (name, immediate = false) => {
    cancelPreview()
    setFeedback('')
    if (immediate) setPreviewName(name)
    else previewTimer.current = window.setTimeout(() => setPreviewName(name), 120)
  }
  const select = name => {
    showPreview(name, true)
    const reason = getStarterSelectionBlocker(name, selectedNames, catalog)
    setFeedback(reason)
    if (!reason) onSelectionChange(names => toggleStarterSelection(name, names, catalog))
  }
  const chooseStage = value => {
    cancelPreview()
    setStage(value)
    setFeedback('')
  }
  const moveStage = (event, index) => {
    const offset = { ArrowLeft: -1, ArrowRight: 1 }[event.key]
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? stageFilters.length - 1 :
      offset ? (index + offset + stageFilters.length) % stageFilters.length : null
    if (next === null) return
    event.preventDefault()
    chooseStage(stageFilters[next])
    tabRefs.current[next]?.focus()
  }

  return <section className="starter-dex" aria-label="시작 디지몬 도감">
    <div className="starter-dex__content" inert={blocked} aria-hidden={blocked || undefined}>
      <header className="starter-dex__header">
        <button type="button" className="starter-dex__back" onClick={onBack}>◀ 뒤로</button>
        <div><p className="starter-dex__eyebrow">{eyebrow}</p><h1>시작 디지몬 선택</h1></div>
        {headerInfo ?? <p className="starter-dex__total">발견 <strong>{seenCount}</strong> / {catalog.entries.length}<small>시작 가능 {unlockedCount}종</small></p>}
        {headerActions}
      </header>

      <div className="starter-dex__body">
        <section className={`starter-detail starter-detail--${preview.status}`} aria-label="현재 디지몬 정보">
          {preview.status !== 'seen' && <div className="starter-detail__heading">
            <span className="starter-detail__stage">{preview.stage}</span>
            <h2>{unknown ? '?' : preview.name}</h2>
          </div>}
          <div className="starter-detail__model">
            {unknown ? <div className="starter-detail__undiscovered" aria-label="미발견 디지몬">?<small>미발견</small></div> : <DigimonModelPreview name={preview.name} facing="front">
              <img src={preview.url} alt={preview.name} />
            </DigimonModelPreview>}
          </div>
          {preview.status === 'seen' && <div className="starter-detail__scan" aria-label={`${preview.name} 스캔 데이터`}>
            <p><span>스캔율</span><strong>{getAnalysisProgress(analysis, preview.name)}<small>%</small></strong></p>
            <progress value={getAnalysisProgress(analysis, preview.name)} max={100} aria-label={`${preview.name} 스캔율`} />
          </div>}
          {unlocked && <><div className="starter-detail__info" role="region" aria-label="디지몬 능력치와 기술" tabIndex={0}><div className="starter-detail__traits" aria-label="타입과 속성">
            <span>{preview.data.타입 ?? '무'}</span><span>{preview.data.속성 ?? '무'}</span>
            <small>시작 Lv.{STARTING_PLAYER_LEVEL}</small>
          </div>
          <section className="starter-detail__stats" aria-label="기본 능력치">
            <p><b>{preview.data.전투성향}</b><span>종족값 합계 {preview.data.전투총합}</span></p>
            <dl>{['체력', '공격', '방어', '특공', '특방', '스피드'].map((field, index) => {
              const key = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'][index]
              const bonus = Number(((getTrainerStatMultiplier(trainerSkills, preview.data, key) - 1) * 100).toFixed(2))
              return <div key={field}><dt>{field === '체력' ? 'HP' : field}</dt><dd>{preview.data[field]}
                {bonus > 0 && <small className="starter-detail__training-bonus" title={`테이머 스킬로 실제 전투 ${field} +${bonus}%`}> +{bonus}%</small>}
              </dd></div>
            })}</dl>
          </section>
          <PassiveAbility combatant={preview.name} />
          <div className="starter-detail__moves">
            <p className="starter-dex__label">시작 기술</p>
            <div aria-label="시작 기술 목록">{Array.from({ length: 4 }, (_, index) => {
              const name = skills[index]
              const detail = name ? getSkillDetails?.(name, preview.data) : null
              return <span key={index} className={!name ? 'starter-detail__move--empty' : ''}
                title={detail ? `${name} · ${detail.분류} · ${detail.속성} · 명중 ${detail.명중률} · 대기 ${detail.cooldown}턴\n${detail.효과설명}` : name ?? ''}>
                {name ?? '—'}{detail && <small>{detail.효과 ? '보조' : `위력 ${detail.데미지}`}</small>}
              </span>
            })}</div>
          </div></div>
          <button type="button" className={`starter-detail__select${selected ? ' starter-detail__select--selected' : ''}`}
            onClick={() => select(preview.name)} aria-disabled={Boolean(previewBlocker)}>
            <span>{selected ? '✓ 선택 해제' : '＋ 팀에 추가'}</span><strong>{preview.baseCost > preview.cost && <del>{preview.baseCost}</del>} 코스트 {preview.cost}</strong>
          </button></>}
        </section>

        <section className="starter-browser" aria-label="디지몬 목록">
          <div className="starter-browser__filters">
            <div className="starter-browser__search">
              <input type="search" aria-label="디지몬 이름 검색" placeholder="디지몬 이름 검색" value={query} maxLength={40}
                onChange={event => { cancelPreview(); setQuery(event.target.value); setFeedback('') }} />
              {query && <button type="button" aria-label="검색어 지우기" onClick={() => setQuery('')}>×</button>}
            </div>
            <select aria-label="디지몬 정렬" value={sort} onChange={event => { cancelPreview(); setSort(event.target.value) }}>
              <option value="number">도감순</option><option value="name">이름순</option><option value="cost">코스트순</option>
            </select>
          </div>
          <div className="starter-browser__stages" role="tablist" aria-label="진화 단계별 분류">
            {stageFilters.map((filter, index) => <button key={filter} type="button" role="tab" aria-selected={stage === filter}
              aria-controls="starter-species-list" tabIndex={stage === filter ? 0 : -1} ref={node => { tabRefs.current[index] = node }}
              onClick={() => chooseStage(filter)} onKeyDown={event => moveStage(event, index)}>
              <span>{filter}</span><small>{filter === '전체' ? catalog.entries.length : catalog.byStage[filter].length}</small>
            </button>)}
          </div>
          <div className="starter-browser__caption"><h2>{stage} 도감</h2><span>{entries.length}종</span></div>
          <div id="starter-species-list" className="starter-browser__grid" ref={gridRef} role="tabpanel" aria-label={`${stage} 디지몬`}>
            {entries.map(entry => {
              const order = selectedNames.indexOf(entry.name)
              const reason = getStarterSelectionBlocker(entry.name, selectedNames, catalog)
              const hidden = entry.status === 'unknown'
              return <button key={entry.name} type="button"
                className={['starter-card', `starter-card--${entry.status}`, preview.name === entry.name ? 'starter-card--active' : '', order >= 0 ? 'starter-card--selected' : '', reason ? 'starter-card--locked' : ''].filter(Boolean).join(' ')}
                aria-label={hidden ? '미발견 디지몬' : `${entry.name}, 코스트 ${entry.cost}${entry.status === 'seen' ? ', 발견' : ''}`} aria-pressed={order >= 0} aria-disabled={Boolean(reason)}
                title={hidden ? '미발견 디지몬' : `${entry.name} · ${entry.stage} · 코스트 ${entry.cost}${reason ? `\n${reason}` : ''}`}
                onPointerEnter={() => showPreview(entry.name)} onPointerLeave={cancelPreview}
                onFocus={() => showPreview(entry.name, true)} onClick={() => select(entry.name)}>
                {!hidden && <span className="starter-card__cost">{entry.cost}</span>}
                {order >= 0 && <span className="starter-card__order">{order + 1}</span>}
                {hidden ? <span className="starter-card__unknown" aria-hidden="true">?</span> : <img src={getDigimonThumbnailUrl(entry.name)} alt="" loading="lazy" decoding="async" />}
                <span className="starter-card__name">{hidden ? '?' : entry.name}</span>
                {entry.status === 'seen' && <span className="starter-card__discovered">발견</span>}
              </button>
            })}
            {!entries.length && <div className="starter-browser__empty"><strong>검색 결과가 없어요</strong><p>이름을 바꾸거나 전체 단계에서 찾아보세요.</p>
              <button type="button" onClick={() => { chooseStage('전체'); setQuery('') }}>전체 도감 보기</button></div>}
          </div>
          <p className="starter-browser__hint" role="status" aria-live="polite">{feedback || previewBlocker || '디지몬을 누르면 팀에 추가 · 다시 누르면 선택 해제'}</p>
        </section>

        <aside className="starter-team" aria-label="시작 팀 구성">
          <header><h2>시작 팀</h2><span>{selectedNames.length}/{teamLimit}</span></header>
          <div className="starter-team__slots">{Array.from({ length: teamLimit }, (_, index) => {
            const entry = summary.team.filter(member => member.status === 'unlocked')[index]
            return entry ? <button key={entry.name} type="button" className="starter-team__slot starter-team__slot--filled"
              aria-label={`${entry.name} 선택 해제`} title={`${entry.stage} · 코스트 ${entry.cost} · 눌러서 선택 해제`}
              onClick={() => { cancelPreview(); setFeedback(''); onSelectionChange(names => names.filter(name => name !== entry.name)) }}>
              <span className="starter-team__order">{index + 1}</span>
              <img src={getDigimonThumbnailUrl(entry.name)} alt="" decoding="async" />
              <span className="starter-team__name">{entry.name}<small>{entry.stage}</small></span>
              <strong className="starter-team__cost">{entry.cost}</strong>
            </button> : <div key={`empty-${index}`} className="starter-team__slot starter-team__slot--empty" aria-label={`빈 팀 슬롯 ${index + 1}`}><span>{index + 1}</span><small>빈 슬롯</small></div>
          })}</div>
          <div className="starter-team__budget" aria-label="전체 코스트">
            <div><span>전체 코스트</span><strong>{summary.cost}{Number.isFinite(costLimit) && <small> / {costLimit}</small>}</strong></div>
            {Number.isFinite(costLimit) && <><progress value={summary.cost} max={costLimit} aria-label="사용한 팀 코스트" />
            <p>남은 코스트 <b>{summary.remaining}</b></p></>}
          </div>
          {modeControl}
          <button type="button" className="starter-team__start" disabled={!summary.canStart || startDisabled} onClick={onStart}>모험 시작 ▶</button>
        </aside>
      </div>
    </div>
    {children}
  </section>
}
