import { getDigimonThumbnailUrl } from '../data/digimonModels.js'
import GameDialog from './GameDialog.jsx'

const commandLabel = row => row.automatic ? '지역 동료 · 자동 공격' : row.completed ? '아군 · 행동 완료' : row.side === 'enemy' ? '적 · 행동 미공개'
  : row.skill ? `${row.skill} → ${row.target}` : '아군 · 명령 대기'

export default function BattleTurnPreview({ rows, busy, onInspect }) {
  return <section className={`battle-turn-preview${busy ? ' battle-turn-preview--busy' : ''}`} aria-label="예상 행동 순서">
    <header><strong>{busy ? '전투 진행 중' : '기술 행동 예상'}</strong>
      <span>{busy ? '연출이 끝나면 다음 명령을 선택하세요' : rows.some(row => row.uncertain) ? '◇ 순서 변동 가능' : '속도순 · 선택한 명령'}</span>
      {!busy && <button type="button" onClick={onInspect} aria-haspopup="dialog" aria-label="예상 행동 순서 자세히 보기">자세히 ↗</button>}</header>
    {!busy && <ol>{rows.map(row => <li key={`${row.side}-${row.id}`} data-side={row.side}
      title={`${row.name} · 속도 ${row.speed}${row.reason ? ` · ${row.reason}: 순서 변동 가능` : ''}${row.skill ? ` · ${row.skill} → ${row.target}` : ''}`}>
      <b className="battle-turn-preview__rank">{row.completed ? '✓' : row.rank}{row.uncertain ? '◇' : ''}</b>
      <img src={getDigimonThumbnailUrl(row.imageName)} alt="" />
      <span className="battle-turn-preview__copy"><strong>{row.name}</strong>
        <span>{commandLabel(row)}</span></span>
    </li>)}</ol>}
  </section>
}

export function BattleTurnDetails({ rows, onClose }) {
  return <GameDialog title="예상 행동 순서" eyebrow="DIGIVICE / TURN ORDER" onClose={onClose} className="battle-turn-details" returnFocusSelector=".battle-turn-preview button">
    <p className="battle-turn-details__intro">현재 속도와 선택한 기술을 기준으로 표시합니다. ◇ 표시는 같은 속도 또는 확률형 선제 효과로 순서가 달라질 수 있다는 뜻입니다.</p>
    <ol className="battle-turn-details__list">{rows.map(row => <li key={`${row.side}-${row.id}`} data-side={row.side}>
      <b className="battle-turn-details__rank" aria-label={row.completed ? '행동 완료' : `예상 ${row.rank}번째${row.uncertain ? ', 변동 가능' : ''}`}>{row.completed ? '✓' : row.rank}{row.uncertain && <small>◇</small>}</b>
      <img src={getDigimonThumbnailUrl(row.imageName)} alt="" />
      <div><p className="battle-turn-details__name"><strong>{row.name}</strong><span>{row.side === 'ally' ? '아군' : '적'} · 속도 {row.speed}</span></p>
        <p className="battle-turn-details__command">{commandLabel(row)}</p>
        {row.reason && <p className="battle-turn-details__reason">◇ {row.reason}{row.haste > 0 ? ` · 이 디지몬의 선제 확률 ${row.haste}%` : ''}</p>}
      </div>
    </li>)}</ol>
    <p className="battle-turn-details__note">적이 사용할 기술과 대상은 행동할 때 공개됩니다. 스캔으로 행동을 마친 아군은 이번 턴에 다시 행동하지 않습니다.</p>
  </GameDialog>
}
