import { describeSpecialQuest } from '../adventure/specialQuests.js'
import { getRegionalAid } from '../battle/regionalSupport.js'
import { useEffect, useRef } from 'react'
import GameDialog from './GameDialog.jsx'
import DigimonModelPreview from './DigimonModelPreview.jsx'
import { getDigimonThumbnailUrl } from '../data/digimonModels.js'
import { getMapPresentation } from '../data/mapPresentation.js'
import { getStoryChoices, getStoryView } from '../adventure/storyEvents.js'
import './StoryEncounter.css'

export default function StoryEncounter({ state, onChoose, onContinue }) {
  const aid = getRegionalAid(state)
  const event = state.explorationEvent, view = getStoryView(state)
  const result = event.result
  const changes = result?.changes ?? []
  const heading = useRef(null)
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    heading.current?.closest('.game-dialog__body')?.scrollTo({ top: 0 })
  }, [event.id, result])
  const choices = getStoryChoices(state)
  const send = (id, value) => onChoose({ id, value, eventId: event.id, revision: event.revision })
  const footer = result ? <>
    <span>이 만남은 모험 수첩에 남았습니다.</span>
    <button type="button" className="game-dialog__primary" onClick={onContinue}>다음 스테이지로</button>
  </> : <>
    <span>한 가지를 고르면 바로 이어집니다.</span>
    <button type="button" className="game-dialog__secondary" onClick={() => send('leave')}>여정을 계속하기</button>
  </>
  return <GameDialog title={view.title} eyebrow={`${event.mapName} · STAGE ${event.stage} · ${view.kind}`}
    className={`story-dialog story-dialog--${event.theme}`} footer={footer}>
    <div className="story-layout">
      <aside className="story-scene" style={{ '--event-map': `url("${getMapPresentation(event.mapName).url}")` }}>
        <div className="story-scene__location"><span>디지털 월드의 길목</span><b>{event.mapName}</b></div>
        <div className="story-scene__model" role="img" aria-label={`${view.npc} 3D 모습`}>
          <DigimonModelPreview name={view.npc} facing="front"><img src={getDigimonThumbnailUrl(view.npc)} alt="" /></DigimonModelPreview>
        </div>
        <div className="story-npc"><strong>{view.npc}</strong>{!view.special && <span aria-label={`NPC 인연 ${view.trust}/3`}>인연 {'●'.repeat(view.trust)}{'○'.repeat(3 - view.trust)}</span>}{aid.profile && <span className="story-region-trust">지역 신뢰 {aid.trust}/3{aid.used ? ' · 지원 완료' : aid.ready ? ' · 보스 지원 대기' : ''}</span>}
            </div>
        <blockquote>{view.dialogue}</blockquote>
        {view.requiresFlag && <p className="story-return">이전에 나눈 도움이 다시 이어졌습니다.</p>}
      </aside>
      <section className="story-content" aria-label={result ? '선택 결과' : '이야기와 선택'}>
        <div className="story-content__heading"><h3 ref={heading} tabIndex={-1}>{result ? result.title : '어떻게 할까요?'}</h3><b>{(state.gold ?? 0).toLocaleString('ko-KR')} G</b></div>
        {result ? <div className="story-outcome" role="status">
          <p data-success={result.success}>{result.ending}</p>
          {changes.length ? <dl>{changes.map((change, i) => <div key={i} data-kind={change.kind}><dt>{change.label}</dt><dd>{change.value}</dd></div>)}</dl>
            : <p className="story-hint">{result.choiceId?.endsWith('-escaped') ? '의뢰 보상은 지급되지 않았습니다.' : '소모하거나 획득한 자원은 없습니다.'}</p>}
        </div> : <>
          <p className="story-opening">{view.opening}</p>
          {view.special && <div className="story-special-offer"><strong>특수 의뢰 · 진화 아이템 확정</strong><span>{describeSpecialQuest(view)}</span><small>성공·실패 모두 신뢰도 변화 없음</small></div>}
          <div className="story-routes" aria-label="해결 방법">{choices.map(route => <button type="button" key={route.id}
            className="story-route" disabled={Boolean(route.disabledReason)} onClick={() => send('resolve', route.id)}>
            <span className="story-route__meta"><span>{route.tag}</span><b>{route.cost}</b></span>
            <strong>{route.title}<span aria-hidden="true"> →</span></strong>
            {route.successChance != null && <span className="story-route__chance"><b>성공 {route.successChance}%</b><span>실패 시 보상 없음 · 신뢰 −1</span><small>{route.chanceReasons.join(' · ')}</small></span>}
            {route.battlePreview && <span className="story-route__battle">
              <span className="story-route__opponents">{route.battlePreview.opponents.map((name, index) => <span key={`${name}-${index}`}>
                <img src={getDigimonThumbnailUrl(name)} alt="" /><span>{name} Lv.{route.battlePreview.level}</span>
              </span>)}</span>
              {route.battlePreview.waves && <span>마지막 수호자 · {route.battlePreview.waves.at(-1).opponents.join('·')} Lv.{route.battlePreview.waves.at(-1).level}</span>}
              <span>{route.battlePreview.rule}</span>
              <small>실제 전투 · HP와 쓰러짐 유지 · {view.special ? '실패해도 신뢰 유지' : '철수·전멸 시 신뢰 −1'}</small>
            </span>}
            <span>{route.battlePreview ? '승리 보상 · ' : ''}{route.description}</span>
            {route.rewardItems?.length > 0 && <span className="story-route__items">{route.rewardItems.map(item => <span key={item.id}>
              <img src={item.imageUrl} alt="" />{item.name}
            </span>)}</span>}
            {(route.disabledReason || route.preview) && <small>{route.disabledReason || route.preview}</small>}
          </button>)}</div>
        </>}
      </section>
    </div>
    {view.journal.length > 0 && <details className="story-journal"><summary>모험 수첩 · 최근 {view.journal.length}번의 만남</summary>
      <ol>{view.journal.map(entry => <li key={`${entry.stage}-${entry.storyId}`}><span>STAGE {entry.stage} · {entry.mapName} · {entry.npc}</span><strong>{entry.title}</strong><p>{entry.choiceTitle} — {entry.ending}</p></li>)}</ol>
    </details>}
  </GameDialog>
}
