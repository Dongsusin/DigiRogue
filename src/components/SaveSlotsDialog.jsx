import { useLayoutEffect, useRef, useState } from 'react'
import GameDialog from './GameDialog.jsx'
import { defaultSaveSlot } from '../progression/saveSlots.js'
import { getDigimonThumbnailUrl } from '../data/digimonModels.js'
import { getGameMode } from '../progression/gameModes.js'
import './SaveSlotsDialog.css'

const savedTime = value => {
  const date = new Date(value)
  return value && Number.isFinite(date.getTime()) ? date.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '이전 저장'
}

export default function SaveSlotsDialog({ mode, slots, currentState, busy, error, onClose, onConfirm }) {
  const [selectedId, setSelectedId] = useState(() => defaultSaveSlot(slots, mode))
  const listRef = useRef(null)
  const selectedRef = useRef(null)
  useLayoutEffect(() => {
    const list = listRef.current, row = selectedRef.current
    if (!list || !row) return
    const top = row.offsetTop, bottom = top + row.offsetHeight
    if (top < list.scrollTop) list.scrollTop = top
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight
  }, [selectedId])
  const selected = slots.find(slot => slot.id === selectedId)
  const exiting = mode === 'exit'
  const canConfirm = !busy && selected && (exiting ? !selected.automatic : selected.status === 'ready')
  return <GameDialog title={exiting ? '저장하고 메인 화면으로 나갈까요?' : '어디서 이어할까요?'}
    eyebrow={exiting ? 'SAVE & RETURN' : 'CONTINUE'} className="save-slots-dialog" backdropClassName="save-slots-backdrop" onClose={onClose}
    footer={<>
      <button className="game-dialog__secondary" type="button" onClick={onClose}>{exiting ? '계속 플레이' : '뒤로'}</button>
      <button className="game-dialog__primary" type="button" disabled={!canConfirm} onClick={() => onConfirm(selectedId)}>
        {exiting ? selected?.status === 'ready' ? '덮어쓰고 나가기' : '저장하고 나가기' : '이어서 시작'}
      </button>
    </>}>
    <p className="save-slots-dialog__intro">{exiting
      ? `STAGE ${currentState?.currentStage ?? 1} · ${currentState?.currentMap ?? ''} — 저장할 슬롯을 선택하세요.`
      : '자동 저장과 선택 저장 중 하나를 선택하세요.'}</p>
    <div ref={listRef} className="save-slot-list" role="region" aria-label="저장 슬롯 목록" tabIndex={0}>
      {slots.map(slot => {
        const selectable = exiting ? !slot.automatic : slot.status === 'ready'
        const state = slot.state
        const occupied = slot.status === 'ready'
        return <button key={slot.id} type="button" ref={selectedId === slot.id ? selectedRef : null}
          className={`save-slot${selectedId === slot.id ? ' save-slot--selected' : ''}${slot.automatic ? ' save-slot--auto' : ''}`}
          disabled={!selectable} aria-pressed={selectedId === slot.id} onClick={() => setSelectedId(slot.id)}
          aria-label={`${slot.label}${occupied ? `, ${getGameMode(state.gameMode).name}, ${state.currentStage}스테이지, ${state.currentMap}` : slot.status === 'invalid' ? ', 읽을 수 없는 저장' : ', 비어 있음'}`}>
          <span className="save-slot__heading"><strong>{slot.label}</strong><span>{slot.automatic ? 'AUTO' : selectedId === slot.id ? '선택됨' : 'SLOT ' + slot.id.slice(-1)}</span></span>
          {occupied ? <>
            <span className="save-slot__location"><b>{getGameMode(state.gameMode).name} · STAGE {state.currentStage}</b><span>{state.dailyDate ?? state.currentMap}</span></span>
            <span className="save-slot__party">{state.party.slice(0, 8).map((unit, index) => <span key={unit?.id ?? index}>
              {getDigimonThumbnailUrl(unit?.imageName ?? unit?.name) ? <img src={getDigimonThumbnailUrl(unit.imageName ?? unit.name)} alt={unit.name} /> : <span className="save-slot__egg" aria-label={unit?.name}>◇</span>}
            </span>)}</span>
            <span className="save-slot__details"><span>{state.party.length}마리 · {(state.gold ?? 0).toLocaleString('ko-KR')} G</span><time>{savedTime(slot.savedAt)}</time></span>
          </> : <span className="save-slot__empty"><span aria-hidden="true">{slot.status === 'invalid' ? '!' : '+'}</span>
            {slot.status === 'invalid' ? '읽을 수 없는 저장' : '비어 있는 슬롯'}</span>}
          {slot.automatic && <span className="save-slot__auto-note">스테이지 진행 시 자동 저장</span>}
        </button>
      })}
    </div>
    {exiting && selected?.status === 'ready' && <p className="save-slots-dialog__notice">{selected.label}의 기존 저장을 덮어씁니다.</p>}
    {busy && <p className="save-slots-dialog__notice" role="status">진행 중인 행동이 끝나면 저장할 수 있습니다.</p>}
    {error && <p className="save-slots-dialog__error" role="alert">{error}</p>}
  </GameDialog>
}
