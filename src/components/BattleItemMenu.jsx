import { useState } from 'react'
import GameDialog from './GameDialog.jsx'
import { BATTLE_CONSUMABLES, BATTLE_ITEM_CATEGORIES, getBattleItemCategory, getBattleItemTargets, getBattleItemUnit } from '../battle/battleItems.js'
import { getItemScanGain } from '../data/adventureItems.js'
import { getScanPreview } from '../battle/digimonAnalysis.js'
import { getTrainerScanGain } from '../progression/trainerSkills.js'
import { isModeItemAllowed } from '../progression/gameModes.js'
import { getItemRarityLabel } from '../data/itemRarities.js'
import './AdventureContent.css'

export default function BattleItemMenu({ state, actor, onUse, onClose }) {
  const [selected, setSelected] = useState(null)
  const [category, setCategory] = useState('전체')
  const [form, setForm] = useState('all')
  const [ownedOnly, setOwnedOnly] = useState(true)
  const allowed = BATTLE_CONSUMABLES.filter(item => isModeItemAllowed(item, state))
  const countOf = item => Math.max(0, state.inventory?.[item.id] ?? 0)
  const owned = allowed.filter(item => countOf(item) > 0)
  const items = allowed.filter(item => (!ownedOnly || countOf(item) > 0) &&
    (form === 'all' || (form === 'card' ? Boolean(item.cardCode) : !item.cardCode)) &&
    (category === '전체' || getBattleItemCategory(item) === category))
    .sort((a, b) => Number(countOf(b) > 0) - Number(countOf(a) > 0) || Number(Boolean(a.cardCode)) - Number(Boolean(b.cardCode)))
  const targets = selected ? getBattleItemTargets(state, selected, actor.id) : []
  const useItem = item => {
    if (item.effect.scan || item.effect.scope === 'all') onUse(item.id, null)
    else setSelected(item)
  }
  return <GameDialog title="전투 아이템" eyebrow={actor.name + '의 명령 · 1회 사용 / 1행동'} onClose={onClose}
    className="battle-card-dialog" returnFocusSelector='[data-command="items"]'
    footer={<><span>{selected ? '대상을 선택하면 사용합니다.' : '전투 보상에서 얻은 아이템을 여기서 사용합니다.'}</span>
      <button type="button" className="game-dialog__secondary" onClick={selected ? () => setSelected(null) : onClose}>
        {selected ? '아이템 목록으로' : '돌아가기'}</button></>}>
    {selected ? <div className="battle-card-targets">
      <div className="battle-card-selected" data-item-form={selected.cardCode ? 'card' : 'supply'}>
        <img src={selected.imageUrl} alt="" /><div><h3>{selected.name}</h3><p>{selected.description}</p>
        <span className="battle-card-target-side">{selected.effect.targetSide === 'enemy' ? '적 디지몬 선택' : selected.effect.revive ? '부활시킬 예비 디지몬 선택' : '아군 디지몬 선택'}</span></div></div>
      <div className="battle-card-target-list">{targets.map(unit => <button type="button" key={unit.id}
        onClick={() => onUse(selected.id, unit.id)} aria-label={unit.name + '에게 ' + selected.name + ' 사용'}>
        <strong>{unit.name}</strong><span>{unit.currentHp > 0 ? 'HP ' + unit.currentHp + ' / ' + unit.maxHp : '전투 불능'}</span>
        {selected.effect.cooldownReduction > 0 && <small>기술 대기 최대 {Math.max(0, ...Object.values(unit.skillCooldowns ?? {}))}턴</small>}
        {unit.statusEffect && <small>{unit.statusEffect.type}</small>}
      </button>)}</div>
    </div> : <>
      <div className="battle-card-toolbar">
        <div className="battle-card-filters" role="group" aria-label="아이템 효과">{BATTLE_ITEM_CATEGORIES.map(label =>
          <button type="button" key={label} aria-pressed={category === label} onClick={() => setCategory(label)}>{label}</button>)}</div>
        <div className="battle-card-summary">
          <label className="battle-item-form">종류 <select aria-label="아이템 종류" value={form} onChange={event => setForm(event.target.value)}>
            <option value="all">전체</option><option value="supply">일반 아이템</option><option value="card">카드</option>
          </select></label>
          <span>보유 {owned.length}종</span>
          <button type="button" aria-pressed={ownedOnly} onClick={() => setOwnedOnly(value => !value)}>보유 아이템만</button>
        </div>
      </div>
      {items.length ? <div className="battle-card-grid">{items.map(item => {
        const count = countOf(item), quantityUnit = getBattleItemUnit(item)
        const usable = getBattleItemTargets(state, item, actor.id).length > 0
        const scanDescription = item.effect.scan ? getScanPreview(state.enemies, state.digimonAnalysis,
          target => getTrainerScanGain(state.trainerSkills, getItemScanGain(state.inventory, 25), target, 'card'), state.unlockedSpecies)
          .map(entry => entry.name + ' +' + entry.gain + '%p').join(' · ') : ''
        return <button type="button" key={item.id} className="battle-card" data-item-id={item.id}
          data-item-form={item.cardCode ? 'card' : 'supply'} disabled={!count || !usable}
          aria-label={item.name + ' 선택 · ' + count + quantityUnit} onClick={() => useItem(item)}>
          <img src={item.imageUrl} alt="" loading="lazy" decoding="async" /><div>
            <div className="battle-card-meta"><small>{getBattleItemCategory(item)}</small><small data-rarity={item.rarity}>{getItemRarityLabel(item.rarity)}</small></div>
            <strong>{item.name}</strong><p>{scanDescription || item.description}</p>
            <span>{count ? '보유 ' + count + ' / ' + item.maxOwned + quantityUnit + (usable ? '' : ' · 사용 대상 없음') : '보유 없음'}</span>
          </div>
        </button>
      })}</div> : <div className="battle-card-empty"><strong>{ownedOnly ? '보유한 ' + (category === '전체' ? '' : category + ' ') + '아이템이 없습니다.' : '이 분류의 아이템이 없습니다.'}</strong>
        <p>전투 보상에서 얻은 소모품이 이곳에 표시됩니다.</p>
        {ownedOnly && <button type="button" onClick={() => setOwnedOnly(false)}>전체 아이템 보기</button>}
      </div>}
    </>}
  </GameDialog>
}
