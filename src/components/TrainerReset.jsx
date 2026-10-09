import { useState } from 'react'
import GameDialog from './GameDialog.jsx'
import { getTrainerSpent } from '../progression/trainerSkills.js'
import './TrainerReset.css'

export default function TrainerReset({ progress, onReset }) {
  const [open, setOpen] = useState(false), [feedback, setFeedback] = useState('')
  const spent = getTrainerSpent(progress.learned, progress.paid)
  const reset = () => {
    const result = onReset()
    setFeedback(result.ok ? `${result.refunded} SP를 돌려받았습니다.` : result.error)
    if (result.ok) setOpen(false)
  }
  return <>
    <button type="button" className="trainer-reset" disabled={!spent} aria-haspopup="dialog" onClick={() => { setFeedback(''); setOpen(true) }}>스킬 리셋</button>
    {!open && feedback && <span className="trainer-reset__feedback" role="status">{feedback}</span>}
    {open && <GameDialog title="스킬을 리셋할까요?" eyebrow="DIGIVICE · TRAINING RESET" onClose={() => setOpen(false)} returnFocusSelector=".trainer-reset"
      footer={<><button type="button" className="game-dialog__secondary" onClick={() => setOpen(false)}>취소</button><button type="button" className="game-dialog__primary" onClick={reset}>리셋</button></>}>
      <p>사용한 {spent} SP를 돌려받습니다. 획득한 SP와 진화 기억은 유지됩니다.</p>
      <p>진행 중인 모험의 스킬은 그대로 유지됩니다.</p>
      {feedback && <p role="alert">{feedback}</p>}
    </GameDialog>}
  </>
}
