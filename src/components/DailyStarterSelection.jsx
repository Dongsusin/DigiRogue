import { useMemo } from 'react'
import StarterSelection from './StarterSelection.jsx'
import { createDailyStarterCatalog } from '../data/starterSelection.js'

export default function DailyStarterSelection({ challenge, catalog, best, ...props }) {
  const dailyCatalog = useMemo(() => createDailyStarterCatalog(catalog, challenge), [catalog, challenge])
  return <StarterSelection key={challenge.date} {...props} catalog={dailyCatalog} eyebrow={`DAILY · ${challenge.date}`}
    headerInfo={<p className="starter-dex__total">오늘의 디지몬 <strong>{dailyCatalog.entries.length}</strong>종
      <small>오늘 최고 기록 {best ? `${best}스테이지` : '—'}</small></p>} />
}
