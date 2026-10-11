import BattlePopover from './BattlePopover.jsx'
import CombatantSummary from './CombatantSummary.jsx'
import './EquipmentTooltip.css'

export function EquippedItemGrid({ items = [] }) {
  if (!items.length) return null
  return <ul className="equipment-tooltip__list" aria-label="장착 아이템" style={{ '--equipment-columns': Math.min(8, items.length) }}>
    {items.map(item => <li key={item.id} className="equipment-tooltip__item">
      <img src={item.imageUrl} alt={item.name} />
    </li>)}
  </ul>
}

export default function EquipmentTooltip({ combatant, items = [], anchor, onClose, levelCap }) {
  if (!combatant) return null
  return <BattlePopover anchor={anchor} onClose={onClose} label={combatant.name + ' 정보'}
    className="equipment-tooltip" placement="overlay" width={384} anchorKeys={false}
    header={<CombatantSummary combatant={combatant} levelCap={levelCap} />}>
    <EquippedItemGrid items={items} />
  </BattlePopover>
}
