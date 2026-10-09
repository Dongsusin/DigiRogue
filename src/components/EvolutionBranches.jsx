import { getCollectionStatus } from '../progression/digimonCollection.js'
import './EvolutionBranches.css'

export default function EvolutionBranches({ options, collection, onSelect }) {
  if (!options.length) return <p className="evolution-detail__empty">현재 선택할 수 있는 다음 진화가 없습니다. 다른 디지몬의 계통은 스캔으로 만나 보세요.</p>
  return <section className="evolution-branches" aria-label="진화 조건">
    {options.map(option => {
      const discovered = getCollectionStatus(collection, option.targetData.이름) !== 'unknown'
      return <article key={option.targetData.이름}
      className={`evolution-branch ${option.canEvolve ? 'evolution-branch--ready' : ''}`}>
      <header>
        <img className="evolution-target-portrait"
          data-discovered={discovered}
          src={option.targetData.imageUrl} alt="" />
        <div><small>{discovered ? `${option.targetData.stage} · ${option.method}` : '???'}</small><h3>{discovered ? option.targetData.이름 : '???'}</h3></div>
      </header>
      {option.requirements.some(requirement => requirement.key !== 'level' && requirement.key !== 'item' && !requirement.key.startsWith('partner-')) && <p className="evolution-branch__note">육성 능력치는 일시적인 전투 효과를 제외합니다. 레벨업·디지클론으로 높일 수 있습니다.</p>}
      <ul className="evolution-branch__requirements" aria-label="필요 조건">
        {option.requirements.map(requirement => <li key={requirement.key} data-met={requirement.isMet}>
          <span><span aria-hidden="true">{requirement.isMet ? '✓' : '○'}</span> {requirement.label}</span>
          <strong>{requirement.key.startsWith('partner-')
            ? `${requirement.current > 0 ? `Lv.${requirement.current}` : '미보유'} / Lv.${requirement.required}`
            : requirement.waived ? '진화 기억 · 면제' : `${requirement.current} / ${requirement.required}${requirement.key === 'item' ? '개' : ''}`}</strong>
        </li>)}
      </ul>
      {option.recipe && <p className="evolution-branch__note">{option.itemWaived ? '진화 기억으로 칩 없이 합체할 수 있습니다. 필요한 파트너는 합체 후 한 마리가 됩니다.' : '파트너들이 조건을 갖춘 뒤 보상에서 조그레스 칩을 선택하세요. 합체 후 한 마리가 됩니다.'}</p>}
      <button type="button" disabled={!option.canEvolve} onClick={() => onSelect(option.targetData.이름)}>
        {option.recipe ? (option.canEvolve ? '조그레스하기' : option.conditionsMet ? '조합 준비 완료 · 조그레스 칩 필요' : '조그레스 조합 준비 중')
          : option.canEvolve ? `${option.method}하기` : '조건 미달'}
      </button>
    </article>})}
  </section>
}
