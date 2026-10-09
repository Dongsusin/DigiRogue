import { getExplorationChoices, getExplorationIntro } from '../adventure/explorationEvents.js'
import GameDialog from './GameDialog.jsx'
import StoryEncounter from './StoryEncounter.jsx'

export default function ExplorationEvent({ state, onChoose, onContinue }) {
  return state.explorationEvent.version >= 4
    ? <StoryEncounter state={state} onChoose={onChoose} onContinue={onContinue} />
    : <LegacyExplorationEvent state={state} onChoose={onChoose} onContinue={onContinue} />
}

function LegacyExplorationEvent({ state, onChoose, onContinue }) {
  const event = state.explorationEvent
  const { title, story } = getExplorationIntro(event)
  const choices = getExplorationChoices(state)
  const result = event.result
  return <GameDialog title={result ? '다음 여정을 위한 준비' : title} eyebrow={`${event.mapName ?? state.currentMap} · STAGE ${event.stage} 탐험`}
    className="exploration-dialog" footer={result ? <>
      <span>다음 전투 · STAGE {event.stage + 1}</span><button type="button" className="game-dialog__primary" onClick={onContinue}>다음 스테이지로</button>
    </> : <>
      <button type="button" className="game-dialog__secondary" onClick={() => onChoose('skip')}>그대로 출발</button>
      <span>한 가지를 고르면 바로 결과가 적용됩니다.</span>
    </>}>
    <div className="exploration-summary"><p>{result ? `${result.title} · 선택 결과` : story}</p><strong>{(state.gold ?? 0).toLocaleString('ko-KR')} G</strong></div>
    {result ? <div className="exploration-result" role="status"><span aria-hidden="true">✓</span><h3>{result.title}</h3><ul>{result.logs.map((log, i) => <li key={i}>{log}</li>)}</ul></div>
      : <div className="exploration-choices">{choices.map(choice => <button type="button" key={choice.id}
        className={`exploration-choice exploration-choice--${choice.id}`}
        disabled={Boolean(choice.disabledReason)} onClick={() => onChoose(choice.id)}>
        <span className="exploration-choice__top"><span className="exploration-choice__icon" aria-hidden="true">{choice.icon}</span><span>{choice.tag}</span><b>{choice.cost}</b></span>
        <strong>{choice.title}</strong><span className="exploration-choice__description">{choice.description}</span>
        <span className="exploration-choice__preview">{choice.disabledReason || choice.preview}</span>
      </button>)}</div>}
  </GameDialog>
}
