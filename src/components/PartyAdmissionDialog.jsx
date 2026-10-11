import { CombatantTraits } from './CombatantSummary.jsx'
import { useState } from 'react'
import GameDialog from './GameDialog.jsx'
import { PARTY_CAPACITY } from '../data/partyLimits.js'
import { getPartyReplacementError } from '../battle/partyAdmission.js'
import './PartyAdmissionDialog.css'

export default function PartyAdmissionDialog({ state, request, error, onReplace, onCancel, onInspect }) {
  const [selectedId, setSelectedId] = useState(null)
  const member = request.member
  const selected = state.party.find(unit => unit.id === selectedId)
  const replacementError = selected ? getPartyReplacementError(state, member, selected.id) : ''
  const legacy = request.kind === 'overflow'
  return <GameDialog title={legacy ? '보유 디지몬 정리' : '새 디지몬 영입'} eyebrow={'보유 ' + state.party.length + ' / ' + PARTY_CAPACITY}
    className="party-admission" footer={<>
      <p className="party-admission__decision" role="status">{error || replacementError || (selected
        ? selected.name + '을(를) 보내고 ' + member.name + '을(를) 영입합니다.' : '대신 보내줄 디지몬을 선택해 주세요.')}</p>
      <div className="party-admission__actions">
        <button type="button" className="game-dialog__secondary" onClick={onCancel}>{legacy ? member.name + ' 보내주기' : '영입 취소'}</button>
        <button type="button" className="game-dialog__primary" disabled={!selected || Boolean(replacementError)} onClick={() => onReplace(selected.id)}>선택한 디지몬과 교체</button>
      </div>
    </>}>
    <div className="party-admission__incoming" tabIndex={0} onPointerEnter={event => onInspect?.(event, member)} onFocus={event => onInspect?.(event, member)}>
      <img src={member.imageUrl} alt="" />
      <div><strong>{member.name}</strong><CombatantTraits combatant={member} /><p>{legacy ? '기존 저장에서 초과한 디지몬입니다.' : '알을 포함해 최대 8마리까지 보유할 수 있습니다.'}</p></div>
      {state.pendingPartyAdmissions.length > 1 && <span>남은 정리 {state.pendingPartyAdmissions.length}마리</span>}
    </div>
    <div className="party-admission__roster" role="group" aria-label="보내줄 디지몬 선택" tabIndex={0}>
      {state.party.map(unit => {
        const reason = getPartyReplacementError(state, member, unit.id)
        return <button key={unit.id} type="button" className="party-admission__member" aria-pressed={selectedId === unit.id}
          disabled={Boolean(reason)} title={reason || undefined} aria-label={unit.name + ' 선택'}
          onPointerEnter={event => onInspect?.(event, unit)} onFocus={event => onInspect?.(event, unit)}
          onClick={() => setSelectedId(unit.id)}>
          <img src={unit.imageUrl} alt="" />
          <span><strong>{unit.name}</strong><small>{unit.isEgg ? '부화까지 ' + Math.max(0, unit.eggStagesRemaining ?? 0) + '스테이지'
            : 'Lv.' + unit.level + ' · HP ' + unit.currentHp + ' / ' + unit.maxHp}</small>
            <CombatantTraits combatant={unit} />
            {reason && <small className="party-admission__protected">마지막 전투 가능 디지몬</small>}</span>
          <span className="party-admission__check" aria-hidden="true">{selectedId === unit.id ? '✓' : ''}</span>
        </button>
      })}
    </div>
  </GameDialog>
}
