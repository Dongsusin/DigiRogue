import { getTrainerLuck } from '../progression/trainerSkills.js'
import { ITEM_LUCK_GRADES, ITEM_LUCK_MAX } from '../progression/itemLuck.js'
import './ItemLuck.css'

export default function ItemLuck({ ranks, expanded = false }) {
  const luck = getTrainerLuck(ranks)
  return <section className={`item-luck${expanded ? ' item-luck--expanded' : ''}`} data-grade={luck.grade}
    aria-label={`아이템 행운 ${luck.grade}등급`} title="행운 등급이 높을수록 높은 등급의 아이템을 더 잘 발견합니다.">
    <div className="item-luck__grade"><span aria-hidden="true">✦</span><span>행운</span><strong>{luck.grade}</strong></div>
    {expanded && <div className="item-luck__progress">
      <ol aria-label="행운 등급 진행">
        {ITEM_LUCK_GRADES.map((entry, index) => <li key={entry.grade}
          className={index === luck.index ? 'is-current' : index < luck.index ? 'is-reached' : ''}
          aria-current={index === luck.index ? 'step' : undefined}>{entry.grade}</li>)}
      </ol>
      <p><span>행운 {luck.points} / {ITEM_LUCK_MAX}</span><span>{luck.nextGrade ? `${luck.nextGrade}등급까지 +${luck.remaining}` : '최대 등급'}</span></p>
    </div>}
  </section>
}
