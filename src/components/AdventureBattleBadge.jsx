import { getRegionalAid } from '../battle/regionalSupport.js'
import { MAP_ENVIRONMENTS, describeEnvironment } from '../battle/mapEnvironment.js'
import './AdventureContent.css'
import { getWorldAnomaly } from '../battle/worldAnomalies.js'

export default function AdventureBattleBadge({ state }) {
  const aid = getRegionalAid(state)
  const field = MAP_ENVIRONMENTS[state.currentMap]
  const anomaly = getWorldAnomaly(state, field)
  const dungeon = state.explorationEvent?.phase === 'battle' && state.explorationEvent.battle.spec.dungeon
  const wave = state.explorationEvent?.battle?.waveIndex ?? 0
  return <div className="adventure-field-badges">
    {field && <span className="environment-badge" tabIndex={0} aria-label={`${field.name} · ${describeEnvironment(state.currentMap)}`}>
      <span aria-hidden="true">◇</span> {field.name}<span className="environment-badge__detail" role="tooltip">{describeEnvironment(state.currentMap)}</span>
    </span>}
    {dungeon && <span className="encounter-badge encounter-badge--dungeon">특별 던전 · {wave + 1} / {state.explorationEvent.battle.spec.waves.length} 전투</span>}
    {anomaly && <span className="environment-badge anomaly-badge" style={{ '--anomaly-color': anomaly.color }} tabIndex={0}
      aria-label={`${anomaly.name} · ${anomaly.description} · 아군·적 공통`}>
      <span aria-hidden="true">⚡</span> {anomaly.name}<span className="environment-badge__detail" role="tooltip">{anomaly.description}<br />아군·적 공통 · {5 - (state.currentStage - 1) % 5}스테이지 뒤 재분석</span>
    </span>}
    {aid.profile && <span className={`environment-badge regional-trust-badge${aid.active ? ' regional-trust-badge--active' : aid.ready ? ' regional-trust-badge--ready' : ''}`} tabIndex={0}
      aria-label={`지역 신뢰 ${aid.trust}/3 · ${aid.active ? '동료 자동 공격' : aid.used ? '지원 완료' : aid.ready ? '보스 지원 대기' : '주민 의뢰로 신뢰 획득'}`}>
      <span aria-hidden="true">{aid.active ? '✦' : '◇'}</span> 신뢰 {aid.trust}/3 {aid.active ? '· 동료 지원 중' : aid.used ? '· 지원 완료' : aid.ready ? '· 지원 대기' : ''}
      <span className="environment-badge__detail" role="tooltip">{aid.profile.name} · 지역 신뢰 2 이상이면 단독 보스·중간보스전에 한 번 합류합니다.<br />동료는 자동 공격하며 보유 파티와 코스트에 포함되지 않습니다.</span>
    </span>}
  </div>
}
