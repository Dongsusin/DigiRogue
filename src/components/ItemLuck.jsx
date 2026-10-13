import { useCallback, useState } from 'react'
import BattlePopover from './BattlePopover.jsx'
import { getTrainerLuck } from '../progression/trainerSkills.js'
import { ITEM_RARITIES } from '../data/itemRarities.js'
import { ITEM_LUCK_GRADES, ITEM_LUCK_MAX, getLuckRewardProbabilities } from '../progression/itemLuck.js'
import './ItemLuck.css'

const percent = value => value === 0 ? '0%' : (value * 100).toFixed(value < .001 ? 3 : 2) + '%'

export default function ItemLuck({ ranks, expanded = false, showOdds = false }) {
  const luck = getTrainerLuck(ranks)
  const [anchor, setAnchor] = useState(null)
  const closeOdds = useCallback(() => setAnchor(null), [])
  const probabilities = showOdds ? getLuckRewardProbabilities(ITEM_RARITIES, luck) : null
  return <section className={['item-luck', expanded ? 'item-luck--expanded' : '', showOdds ? 'item-luck--has-odds' : ''].filter(Boolean).join(' ')} data-grade={luck.grade}
    aria-label={`아이템 행운 ${luck.grade}등급`}
    title={showOdds ? undefined : '행운 등급이 높을수록 높은 등급의 아이템을 더 잘 발견합니다.'}
    tabIndex={showOdds ? 0 : undefined}
    onPointerEnter={showOdds ? event => setAnchor(event.currentTarget) : undefined}
    onFocus={showOdds ? event => setAnchor(event.currentTarget) : undefined}>
    <div className="item-luck__grade"><span aria-hidden="true">✦</span><span>행운</span><strong>{luck.grade}</strong></div>
    {expanded && <div className="item-luck__progress">
      <ol aria-label="행운 등급 진행">
        {ITEM_LUCK_GRADES.map((entry, index) => <li key={entry.grade}
          className={index === luck.index ? 'is-current' : index < luck.index ? 'is-reached' : ''}
          aria-current={index === luck.index ? 'step' : undefined}>{entry.grade}</li>)}
      </ol>
      <p><span>행운 {luck.points} / {ITEM_LUCK_MAX}</span><span>{luck.nextGrade ? `${luck.nextGrade}등급까지 +${luck.remaining}` : '최대 등급'}</span></p>
    </div>}
    {showOdds && anchor && <BattlePopover anchor={anchor} onClose={closeOdds} width={420} anchorKeys={false}
      label={`행운 ${luck.grade}등급 아이템 확률`} className="item-luck-odds">
      <table className="item-luck-odds__table" aria-label={`현재 행운 ${luck.grade}등급 확률표`}>
        <thead><tr><th scope="col">행운</th>{ITEM_RARITIES.map(rarity => <th scope="col" key={rarity.key} data-rarity={rarity.key}>{rarity.label}</th>)}</tr></thead>
        <tbody><tr><th scope="row">{luck.grade}</th>{ITEM_RARITIES.map(rarity => <td key={rarity.key} data-rarity={rarity.key}>{percent(probabilities[rarity.key])}</td>)}</tr></tbody>
      </table>
    </BattlePopover>}
  </section>
}
