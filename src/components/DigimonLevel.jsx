import { isAtLevelCap } from '../progression/gameDifficulty.js'
import './DigimonLevel.css'

export default function DigimonLevel({ level, levelCap, className = '', as: element = 'span' }) {
  const Tag = element
  const capped = isAtLevelCap(level, levelCap)
  return <Tag className={`digimon-level ${className}`.trim()} data-level-capped={capped}
    title={capped ? `레벨 상한 Lv.${levelCap} 도달` : undefined}
    aria-label={capped ? `레벨 ${level}, 현재 레벨 상한 도달` : undefined}>Lv.{level}</Tag>
}
