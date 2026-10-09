import { getScanPreview, ANALYSIS_SCAN_GAIN } from '../battle/digimonAnalysis.js'

export default function DigimonAnalysisPanel({ enemies, analysis, unlockedSpecies = [], onScan, scanGain = ANALYSIS_SCAN_GAIN }) {
  const targets = getScanPreview(enemies, analysis, scanGain, unlockedSpecies)
  const canScan = targets.some(unit => unit.gain > 0)
  return <section className="digimon-analysis" aria-label="디지몬 데이터 분석">
    <header><strong>DATA SCAN · 스캔 데이터</strong><span>종별 기록</span></header>
    {targets.map(unit => {
      const { progress, after, count } = unit
      return <div key={unit.name} className="digimon-analysis__target">
        <span>{unit.name}{count > 1 ? ` · ${count}마리` : ''}</span><strong>{progress < 100 ? `${progress}% → ${after}%` : '100% · 부화 가능'}</strong>
        <span className="digimon-analysis__meter" role="meter" aria-label={`${unit.name} 스캔율`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <i className="digimon-analysis__projected" style={{ width: `${after}%` }} />
          <i style={{ width: `${progress}%` }} /></span>
      </div>
    })}
    <p>진화 단계·전투력·수집 난이도에 따라 증가량이 달라집니다.<br />100%를 모으면 전투 보상 화면에서 부화할 수 있습니다.</p>
    <button type="button" className="digimon-analysis__scan" disabled={!canScan} onClick={onScan}>
      {canScan ? '적 전체 스캔 · 행동 1회' : '스캔 완료'}</button>
    <small>같은 종은 한 번에 하나의 표본만 수집합니다. 스캔은 현재 파트너의 행동 1회를 사용합니다.</small>
  </section>
}
