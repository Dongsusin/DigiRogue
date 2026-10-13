import { useState } from 'react'
import GameDialog from './GameDialog.jsx'
import DigimonModelPreview from './DigimonModelPreview.jsx'
import { getDigimonThumbnailUrl } from '../data/digimonModels.js'
import { getMapPresentation } from '../data/mapPresentation.js'
import { PORTAL_EVENT } from '../adventure/anomalyEvents.js'
import './AnomalyEncounter.css'

export default function AnomalyEncounter({ state, remodelOptions = [], onChoose, onContinue }) {
  const event = state.explorationEvent, result = event.result
  const portal = event.kind === PORTAL_EVENT
  const [selectedId, setSelectedId] = useState(null)
  const selected = remodelOptions.find(option => option.member.id === selectedId && !option.disabledReason)?.member
  const resultingMember = result?.memberId && state.party.find(unit => unit.id === result.memberId)
  const displayed = result ? resultingMember : selected
  const send = (id, value) => onChoose({ id, value, eventId: event.id, revision: event.revision })
  const mapName = result?.destination ?? event.mapName
  const title = portal ? '차원의 통로' : '데이터 개조 기계'
  return <GameDialog title={title} eyebrow={event.mapName + ' · STAGE ' + event.stage}
    className={'anomaly-dialog anomaly-dialog--' + (portal ? 'portal' : 'remodel')}
    footer={result ? <>
      <span>{result.destination ?? 'STAGE ' + (event.stage + 1)}</span>
      <button type="button" className="game-dialog__primary" onClick={onContinue}>다음 스테이지로</button>
    </> : <>
      <button type="button" className="game-dialog__secondary" onClick={() => send('decline')}>이용하지 않는다</button>
      <button type="button" className="game-dialog__primary" disabled={!portal && !selected}
        onClick={() => send('use', selectedId)}>이용한다</button>
    </>}>
    <div className="anomaly-layout">
      <div className="anomaly-scene" style={{ '--anomaly-map': 'url("' + getMapPresentation(mapName).url + '")' }}>
        <div className="anomaly-scene__location">{mapName}</div>
        {portal ? <div className="dimension-gate" aria-hidden="true"><div /><div /><div /><span>◇</span></div>
          : <div className="remodel-chamber" aria-hidden="true"><div className="remodel-chamber__circuit" /><div className="remodel-chamber__base" /></div>}
        {!portal && displayed && <div className="anomaly-model">
          {displayed.isEgg ? <img className="anomaly-egg" src={displayed.imageUrl} alt={displayed.name} />
            : <DigimonModelPreview key={displayed.name} name={displayed.imageName ?? displayed.name} facing="front">
              <img src={getDigimonThumbnailUrl(displayed.name)} alt={displayed.name} />
            </DigimonModelPreview>}
        </div>}
        {!portal && !displayed && <div className="anomaly-scene__symbol" aria-hidden="true">{result ? '◇' : '+'}</div>}
        <div className="anomaly-scene__caption">{portal ? result?.destination ? '차원 연결 완료' : '미지의 좌표' : displayed?.name ?? '개조 대기'}</div>
      </div>
      <section className="anomaly-content" aria-label={result ? '선택 결과' : portal ? '통로 이용 선택' : '개조 대상 선택'}>
        {result ? <div className="anomaly-result" role="status" data-success={result.success}>
          <span className="anomaly-kicker">{result.choiceId === 'decline' ? 'PASS' : portal ? 'CONNECTED' : result.success ? 'SUCCESS' : 'RESET'}</span>
          <h3>{result.title}</h3><p>{result.ending}</p>
          {result.destination && <div className="anomaly-destination"><span>{event.mapName}</span><b aria-hidden="true">→</b><strong>{result.destination}</strong></div>}
          {result.isEgg && <span className="anomaly-risk">레벨 1 · 장착 아이템 초기화</span>}
        </div> : portal ? <div className="anomaly-portal-copy">
          <span className="anomaly-kicker">DIMENSION GATE</span><h3>어디로 이어질까요?</h3>
          <p>다른 무작위 맵으로 이동합니다.</p>
          <div className="anomaly-destination"><span>{event.mapName}</span><b aria-hidden="true">→</b><strong>???</strong></div>
          <span className="anomaly-note">스테이지 유지 · 이동 시 파티 회복</span>
        </div> : <>
          <div className="anomaly-odds"><strong>개조 성공 50%</strong><span>진화 조건·재료 무시</span></div>
          <p className="anomaly-note">성공: 모든 진화 후보 중 무작위 선택</p>
          <p className="anomaly-risk">실패: 디지에그로 초기화 · 장착 아이템 전부 소실</p>
          <div className="remodel-party" aria-label="보유 디지몬">{remodelOptions.map(({ member, disabledReason }) =>
            <button type="button" className="remodel-member" key={member.id} disabled={Boolean(disabledReason)}
              aria-pressed={selectedId === member.id} aria-label={member.name + (disabledReason ? ' · ' + disabledReason : ' 선택')}
              onClick={() => setSelectedId(member.id)}>
              <img src={member.isEgg ? member.imageUrl : getDigimonThumbnailUrl(member.name)} alt="" />
              <span><strong>{member.name}</strong><small>{disabledReason || 'Lv.' + member.level}</small></span>
              {selectedId === member.id && <b aria-hidden="true">✓</b>}
            </button>)}</div>
        </>}
      </section>
    </div>
  </GameDialog>
}
