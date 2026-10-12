import { useCallback, useEffect, useState } from 'react'
import GameDialog from './GameDialog.jsx'
import BattlePopover from './BattlePopover.jsx'
import CombatantSummary from './CombatantSummary.jsx'
import { getDigimonThumbnailUrl } from '../data/digimonModels.js'
import './HallOfFame.css'

const modes = [{ id: 'classic', name: '캐주얼' }, { id: 'hard', name: '하드' }]
const dateLabel = value => new Date(value).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' })
const portrait = unit => unit.isEgg ? '/아이템/디지에그/' + encodeURIComponent(unit.eggName) + '.png' : getDigimonThumbnailUrl(unit.imageName ?? unit.name)
function Trophy() { return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M9 4h14v9a7 7 0 0 1-14 0V4ZM9 7H4v5c0 4 3 6 7 6M23 7h5v5c0 4-3 6-7 6M16 20v7M10 28h12" /></svg> }

function FinalMemberTooltip({ unit, anchor, onClose, itemById, skillInfo }) {
  const combatant = { ...unit, imageUrl: portrait(unit) }
  return <BattlePopover anchor={anchor} onClose={onClose} label={unit.name + ' 클리어 당시 정보'}
    placement="overlay" width={390} anchorKeys={false} className="hall-member-tooltip"
    header={<CombatantSummary combatant={combatant} />}>
    {!unit.isEgg && <>
      <dl className="hall-member-tooltip__stats">
        {[['attack','공격'],['defense','방어'],['specialAttack','특공'],['specialDefense','특방'],['speed','스피드']].map(([key,label]) =>
          <div key={key}><dt>{label}</dt><dd>{unit[key]?.toLocaleString() ?? '—'}</dd></div>)}
      </dl>
      <h3>최종 기술</h3>
      <ul className="hall-member-tooltip__skills">{unit.skills.map(name => {
        const skill = skillInfo?.(name, unit)
        const power = skill?.위력 ?? skill?.데미지
        return <li key={name}><strong>{name}</strong><small>{[skill?.속성, skill?.분류, power ? '위력 ' + power : null].filter(Boolean).join(' · ')}</small></li>
      })}</ul>
      <h3>장착 아이템</h3>
      {unit.items.length ? <ul className="hall-member-tooltip__items" aria-label="최종 장착 아이템">
        {unit.items.map(item => <li key={item.id} aria-label={item.name + ' ' + item.count + '개'}>
          {itemById.get(item.id)?.imageUrl ? <img src={itemById.get(item.id).imageUrl} alt={item.name} /> : <span>{item.name}</span>}
          <b>{item.count}</b>
        </li>)}
      </ul> : <p className="hall-member-tooltip__none">없음</p>}
    </>}
  </BattlePopover>
}

export default function HallOfFame({ identity, itemById, skillInfo, onClose, retryPending, transportFactory }) {
  const [mode, setMode] = useState('classic'), [records, setRecords] = useState([])
  const [phase, setPhase] = useState('loading'), [error, setError] = useState(''), [reload, setReload] = useState(0)
  const [tooltip, setTooltip] = useState(null)
  const closeTooltip = useCallback(() => setTooltip(null), [])
  useEffect(() => {
    let active = true
    setPhase('loading'); setError(''); setRecords([]); setTooltip(null)
    const load = async () => {
      await retryPending?.()
      const factory = transportFactory ?? (await import('../hall/firebaseHall.js')).createFirebaseHall
      const client = await factory(identity)
      const values = await client.list(mode)
      if (active) { setRecords(values); setPhase('ready') }
    }
    load().catch(cause => { if (active) { setPhase('error'); setError(cause.message || '기록을 불러오지 못했습니다.') } })
    return () => { active = false }
  }, [mode, reload, identity, transportFactory, retryPending])
  const selectMode = next => { setTooltip(null); setMode(next) }
  return <GameDialog title="명예의 전당" eyebrow="HALL OF FAME" onClose={onClose}
    returnFocusSelector='[data-menu-key="hall-of-fame"]' className="hall-of-fame" backdropClassName="hall-of-fame-backdrop">
    <div className="hall-of-fame__toolbar">
      <div className="hall-of-fame__tabs" role="tablist" aria-label="명예의 전당 모드">
        {modes.map((entry, index) => <button key={entry.id} id={'hall-tab-' + entry.id} type="button" role="tab"
          aria-selected={mode === entry.id} aria-controls="hall-records" tabIndex={mode === entry.id ? 0 : -1}
          onClick={() => selectMode(entry.id)} onKeyDown={event => {
            if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return
            event.preventDefault()
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - index
            selectMode(modes[next].id)
            event.currentTarget.parentElement.children[next].focus()
          }}>{entry.name}<small>TOP 10</small></button>)}
      </div>
      <span className="hall-of-fame__sort">200층 클리어 · 총 턴 오름차순</span>
      <button className="hall-of-fame__refresh" type="button" disabled={phase === 'loading'}
        onClick={() => setReload(n => n + 1)} aria-label="명예의 전당 새로고침">↻ 새로고침</button>
    </div>
    <section id="hall-records" className="hall-of-fame__records" role="tabpanel" aria-labelledby={'hall-tab-' + mode} aria-busy={phase === 'loading'} tabIndex={0}>
      {phase === 'loading' ? <div className="hall-of-fame__empty" role="status"><Trophy/><p>클리어 기록을 불러오는 중…</p></div> :
        phase === 'error' ? <div className="hall-of-fame__empty" role="alert"><Trophy/><p>{error}</p><button type="button" onClick={() => setReload(n => n + 1)}>다시 불러오기</button></div> :
        !records.length ? <div className="hall-of-fame__empty"><Trophy/><h3>첫 번째 클리어를 기다립니다</h3><p>{modes.find(entry => entry.id === mode).name} 200층의 마지막 순간을 이곳에 남겨 보세요.</p></div> :
        <ol className="hall-of-fame__list">{records.map((record, index) =>
          <li key={record.playerKey + ':' + record.runId} className={'hall-record' + (index < 3 ? ' hall-record--podium' : '')}>
            <div className="hall-record__rank" aria-label={index + 1 + '위'}>{index === 0 && <Trophy/>}<b>{String(index + 1).padStart(2, '0')}</b></div>
            <div className="hall-record__team" aria-label="최종 멤버">{record.members.map((unit, i) =>
              <button type="button" key={i} className="hall-record__member" aria-label={unit.name + ' 클리어 당시 정보'}
                onMouseEnter={event => setTooltip({ unit, anchor: event.currentTarget })}
                onFocus={event => setTooltip({ unit, anchor: event.currentTarget })}
                onClick={event => setTooltip({ unit, anchor: event.currentTarget })}>
                <img src={portrait(unit)} alt="" loading="lazy" decoding="async" /><span>{unit.name}</span>
              </button>)}</div>
            <div className="hall-record__result"><strong>{record.totalTurns.toLocaleString()}<small>턴</small></strong>
              <span>200층 클리어</span><time dateTime={new Date(record.clearedAt).toISOString()}>{dateLabel(record.clearedAt)}</time><small>{record.mapName}</small></div>
          </li>)}</ol>}
    </section>
    {tooltip && <FinalMemberTooltip {...tooltip} onClose={closeTooltip} itemById={itemById} skillInfo={skillInfo}/>}
  </GameDialog>
}
