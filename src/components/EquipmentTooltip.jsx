import BattlePopover from './BattlePopover.jsx'
import './EquipmentTooltip.css'

export default function EquipmentTooltip({ combatant, items, anchor, onClose }) {
  if (!items.length) return null
  const columns = Math.min(8, items.length)
  return <BattlePopover anchor={anchor} onClose={onClose} label={combatant.name + ' 장착 아이템'}
    className="equipment-tooltip" placement="overlay" width={22 + columns * 40 + (columns - 1) * 6} anchorKeys={false}>
    <ul className="equipment-tooltip__list" style={{ '--equipment-columns': columns }}>
      {items.map(item => <li key={item.id} className="equipment-tooltip__item">
        <img src={item.imageUrl} alt={item.name} />
      </li>)}
    </ul>
  </BattlePopover>
}
