import { useEffect, useMemo, useRef, useState } from 'react'
import { ACHIEVEMENT_CATEGORIES, getAchievementRows } from '../progression/achievements.js'
import { getTrainerPoints } from '../progression/trainerSkills.js'
import { getDigimonPreviewUrl } from '../data/digimonModels.js'
import './AchievementsScreen.css'

function Medal({ completed = false }) {
  return <svg viewBox="0 0 36 40" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="m10 24-3 13 11-5 11 5-3-13" /><circle cx="18" cy="15" r="12" />
    {completed ? <path d="m12 15 4 4 8-9" /> : <path d="m18 7 2.5 5 5.5 1-4 4 .5 5-4.5-2.5-4.5 2.5.5-5-4-4 5.5-1Z" />}
  </svg>
}
export default function AchievementsScreen({ progress, collection, trust, modes, itemCatalog, onBack }) {
  const [category, setCategory] = useState('all'), [filter, setFilter] = useState('all'), [query, setQuery] = useState('')
  const backRef = useRef(null), listRef = useRef(null)
  useEffect(() => { backRef.current?.focus() }, [])
  useEffect(() => {
    const key = event => { if (event.key === 'Escape') { event.preventDefault(); onBack() } }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onBack])
  useEffect(() => { listRef.current?.scrollTo({ top: 0 }) }, [category, filter, query])
  const rows = useMemo(() => getAchievementRows(progress, { collection, trust, modes, itemCatalog }), [progress, collection, trust, modes, itemCatalog])
  const completed = rows.filter(row => row.completed).length
  const visible = rows.filter(row => (category === 'all' || row.category === category) &&
    (filter === 'all' || row.completed === (filter === 'completed')) &&
    (!query.trim() || row.known && (row.name + row.description).replaceAll(' ', '').includes(query.replaceAll(' ', '').trim())))
  return <section className="achievements-screen" aria-label="업적">
    <header className="achievements-header">
      <button ref={backRef} type="button" onClick={onBack} className="achievements-back">◀ 뒤로</button>
      <div className="achievements-title"><span>DIGITAL WORLD RECORDS</span><h1>업적</h1></div>
      <div className="achievements-total"><Medal /><div><span>달성한 업적</span><strong>{completed}<small> / {rows.length}</small></strong></div></div>
      <div className="achievements-points"><span>스킬 포인트</span><strong>{getTrainerPoints(progress)}<small> SP</small></strong></div>
    </header>
    <nav className="achievements-categories" aria-label="업적 분류">{ACHIEVEMENT_CATEGORIES.map(tab => {
      const entries = rows.filter(row => tab.id === 'all' || row.category === tab.id)
      return <button key={tab.id} type="button" aria-pressed={category === tab.id} onClick={() => setCategory(tab.id)}>
        {tab.name}<small>{entries.filter(row => row.completed).length}/{entries.length}</small>
      </button>
    })}</nav>
    <div className="achievements-toolbar">
      <div className="achievements-filters" role="group" aria-label="달성 상태">{[['all', '전체'], ['incomplete', '미달성'], ['completed', '달성 완료']].map(([id, name]) =>
        <button type="button" key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{name}</button>)}</div>
      <span className="achievements-count">{visible.length}개</span>
      <input aria-label="업적 검색" placeholder="업적 검색" value={query} onChange={event => setQuery(event.target.value)} />
    </div>
    <div className="achievements-list" ref={listRef} tabIndex={0} aria-label="업적 목록">
      {visible.length === 0 && <p className="achievements-empty">해당하는 업적이 없습니다.</p>}
      {visible.map(row => {
        const percent = row.target > 0 ? Math.min(100, Math.floor(row.current / row.target * 100)) : 0
        const image = row.known && row.imageName ? getDigimonPreviewUrl(row.imageName) : ''
        return <article key={row.id} data-achievement-id={row.id} className={'achievement-card' + (row.completed ? ' is-completed' : '')}>
          <div className="achievement-card__portrait">{image ? <img src={image} alt="" loading="lazy" decoding="async" /> :
            row.known ? <Medal completed={row.completed} /> : <span aria-label="미발견">?</span>}</div>
          <div className="achievement-card__body">
            <div className="achievement-card__eyebrow"><span>{ACHIEVEMENT_CATEGORIES.find(tab => tab.id === row.category)?.name}</span><b>{row.completed ? '달성 완료' : '+' + row.points + ' SP'}</b></div>
            <h2>{row.known ? row.name : '???'}</h2>
            <p>{row.known ? row.description : row.category === 'trust' ? '아직 만나지 않은 디지몬의 신뢰' : '아직 발견하지 않은 상대'}</p>
          </div>
          <div className="achievement-card__progress">
            <div><span>{row.completed ? row.points + ' SP 지급 완료' : '진행도'}</span><strong>{row.current.toLocaleString()} / {row.target.toLocaleString()}</strong></div>
            <div className="achievement-progress" role="progressbar" aria-label={row.known ? row.name : '미발견 업적'} aria-valuemin={0} aria-valuemax={row.target} aria-valuenow={row.current}><span style={{ width: percent + '%' }} /></div>
          </div>
        </article>
      })}
    </div>
    <footer className="achievements-footer"><span>최초 달성 시 스킬 포인트 자동 지급</span><span>달성 기록은 다음 모험에도 유지됩니다.</span></footer>
  </section>
}
