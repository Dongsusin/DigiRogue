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

export default function SaveSlotsDialog({ mode, slots, currentState, busy, saving = false, error, onClose, onConfirm, onDelete }) {
  const [selectedId, setSelectedId] = useState(() => defaultSaveSlot(slots, mode))
  const [deleteId, setDeleteId] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const listRef = useRef(null)
  const selectedRef = useRef(null)
  useLayoutEffect(() => {
    const list = listRef.current, row = selectedRef.current
    if (!list || !row) return
    const top = row.offsetTop, bottom = top + row.offsetHeight
    if (top < list.scrollTop) list.scrollTop = top
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight
  }, [selectedId, deleteId])
  const selected = slots.find(slot => slot.id === selectedId)
  const exiting = mode === 'exit'
  const canConfirm = !busy && selected && (exiting ? !selected.automatic : selected.status === 'ready')
  const deleteTarget = !exiting && slots.find(slot => slot.id === deleteId && slot.status !== 'empty')
  const cancelDelete = () => { setDeleteId(null); setDeleteError('') }
  const confirmDelete = () => {
    const result = onDelete?.(deleteTarget.id)
    if (!result?.ok) { setDeleteError(result?.error ?? '저장 기록을 삭제하지 못했습니다. 다시 시도해 주세요.'); return }
    if (selectedId === deleteTarget.id) setSelectedId(defaultSaveSlot(slots.filter(slot => slot.id !== deleteTarget.id), mode))
    cancelDelete()
  }
  if (deleteTarget) return <GameDialog key="delete" title={deleteTarget.label + ' 기록을 삭제할까요?'} eyebrow="DELETE SAVE"
    className="save-slots-dialog save-slots-dialog--delete" backdropClassName="save-slots-backdrop" onClose={cancelDelete}
    footer={<>
      <button className="game-dialog__secondary" type="button" onClick={cancelDelete}>취소</button>
      <button className="game-dialog__primary save-slots-dialog__delete-confirm" type="button" onClick={confirmDelete}>삭제</button>
    </>}>
    <p className="save-slots-dialog__delete-summary">{deleteTarget.status === 'ready'
      ? getGameMode(deleteTarget.state.gameMode).name + ' · STAGE ' + deleteTarget.state.currentStage + ' · ' + deleteTarget.state.currentMap
      : '읽을 수 없는 저장'}</p>
    <p className="save-slots-dialog__delete-warning">삭제한 저장은 되돌릴 수 없습니다.</p>
    <p className="save-slots-dialog__intro">도감·스캔·스킬·업적·신뢰도 기록은 유지됩니다.</p>
    {deleteError && <p className="save-slots-dialog__error" role="alert">{deleteError}</p>}
  </GameDialog>
  return <GameDialog key="slots" title={exiting ? '저장하고 메인 화면으로 나갈까요?' : '어디서 이어할까요?'}
    eyebrow={exiting ? 'SAVE & RETURN' : 'CONTINUE'} className="save-slots-dialog" backdropClassName="save-slots-backdrop" onClose={onClose}
    footer={<>
      <button className="game-dialog__secondary" type="button" disabled={saving} onClick={onClose}>{exiting ? '계속 플레이' : '뒤로'}</button>
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
        const canDelete = !exiting && onDelete && slot.status !== 'empty'
        return <div key={slot.id} className={canDelete ? 'save-slot-row save-slot-row--deletable' : 'save-slot-row'}
          ref={selectedId === slot.id ? selectedRef : null}>
          <button type="button"
            className={`save-slot${selectedId === slot.id ? ' save-slot--selected' : ''}${slot.automatic ? ' save-slot--auto' : ''}`}
            disabled={!selectable || busy} aria-pressed={selectedId === slot.id} onClick={() => setSelectedId(slot.id)}
            aria-label={`${slot.label}${occupied ? `, ${getGameMode(state.gameMode).name}, ${state.currentStage}스테이지, ${state.currentMap}` : slot.status === 'invalid' ? ', 읽을 수 없는 저장' : ', 비어 있음'}`}>
            <span className="save-slot__heading"><strong>{slot.label}</strong><span>{slot.automatic ? 'AUTO' : selectedId === slot.id ? '선택됨' : 'SLOT ' + slot.id.slice(-1)}</span></span>
            {occupied ? <>
              <span className="save-slot__location"><b>{getGameMode(state.gameMode).name} · STAGE {state.currentStage}</b><span>{state.dailyDate ?? state.currentMap}</span></span>
              <span className="save-slot__party">{state.party.slice(0, 8).map((unit, index) => <span key={unit?.id ?? index}>
                {unit?.isEgg || getDigimonThumbnailUrl(unit?.imageName ?? unit?.name) ? <img src={unit.isEgg ? unit.imageUrl : getDigimonThumbnailUrl(unit.imageName ?? unit.name)} alt={unit.name} /> : <span className="save-slot__egg" aria-label={unit?.name}>◇</span>}
              </span>)}</span>
              <span className="save-slot__details"><span>{state.party.length}마리 · {(state.gold ?? 0).toLocaleString('ko-KR')} G</span><time>{savedTime(slot.savedAt)}</time></span>
            </> : <span className="save-slot__empty"><span aria-hidden="true">{slot.status === 'invalid' ? '!' : '+'}</span>
              {slot.status === 'invalid' ? '읽을 수 없는 저장' : '비어 있는 슬롯'}</span>}
            {slot.automatic && <span className="save-slot__auto-note">스테이지 진행 시 자동 저장</span>}
          </button>
          {canDelete && <button type="button" className="save-slot__delete" disabled={busy}
            aria-label={slot.label + ' 삭제'} title={slot.label + ' 삭제'}
            onClick={() => { setDeleteError(''); setDeleteId(slot.id) }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" />
            </svg>
          </button>}
        </div>
      })}
    </div>
    {exiting && selected?.status === 'ready' && <p className="save-slots-dialog__notice">{selected.label}의 기존 저장을 덮어씁니다.</p>}
    {busy && <p className="save-slots-dialog__notice" role="status">{saving ? '저장 중입니다.' : '진행 중인 행동이 끝나면 저장할 수 있습니다.'}</p>}
    {error && <p className="save-slots-dialog__error" role="alert">{error}</p>}
  </GameDialog>
}
