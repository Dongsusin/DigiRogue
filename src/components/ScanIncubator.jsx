import { useState } from 'react'
import { getDigimonThumbnailUrl } from '../data/digimonModels.js'

export default function ScanIncubator({ entries, busy, onHatch, message }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const readyCount = entries.filter(entry => entry.progress >= 100).length
  const visible = entries.filter(entry => entry.name.includes(query.trim()) &&
    (filter === 'all' || (filter === 'ready' ? entry.progress >= 100 : entry.progress < 100)))
  return <section className="scan-incubator" role="tabpanel" id="scan-reward-panel" aria-labelledby="scan-reward-tab">
    <header><strong>스캔 데이터 부화</strong>
      <label>디지몬 찾기<input value={query} onChange={event => setQuery(event.target.value)} placeholder="이름 검색" /></label></header>
    <div className="scan-incubator__toolbar">
      <div className="scan-incubator__status" role="status">{message || `부화 가능 ${readyCount}종 · 기록 ${entries.length}종`}</div>
      <div className="scan-incubator__filters" role="group" aria-label="스캔 데이터 필터">
        {[['all', '전체', entries.length], ['ready', '부화 가능', readyCount], ['collecting', '수집 중', entries.length - readyCount]].map(([id, label, count]) =>
          <button type="button" key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label} <span>{count}</span></button>)}
      </div>
    </div>
    <div className="scan-incubator__list">
      {visible.map(entry => <article key={entry.name} data-ready={entry.progress >= 100} className="scan-incubator__entry">
        <img src={getDigimonThumbnailUrl(entry.imageName ?? entry.name)} alt="" />
        <div className="scan-incubator__identity"><strong>{entry.name}</strong>
          <span className="digimon-analysis__meter" role="meter" aria-label={`${entry.name} 스캔율`} aria-valuenow={entry.progress} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${entry.progress}%` }} /></span>
        </div><strong className="scan-incubator__percent">{entry.progress}%</strong>
        <button type="button" disabled={busy || entry.progress < 100} onClick={() => onHatch(entry.name)} aria-label={`${entry.name} 부화`}>
          {busy ? '부화 중' : entry.progress >= 100 ? '부화하기' : '수집 중'}</button>
      </article>)}
      {!visible.length && <p className="scan-incubator__empty">{query ? '검색 결과가 없습니다.'
        : filter === 'ready' ? '부화 가능한 디지몬이 없습니다.'
          : filter === 'collecting' && entries.length ? '수집 중인 디지몬이 없습니다.' : '기록된 디지몬이 없습니다.'}</p>}
    </div>
  </section>
}
