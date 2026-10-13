import { useMemo, useRef, useState } from 'react'
import { ITEM_RARITIES, getItemRarityLabel } from '../data/itemRarities.js'
import { filterItemDex, getItemDexDisplay } from '../data/itemDex.js'
import './ItemDex.css'

export default function ItemDex({ catalog = [], collection = {} }) {
  const [rarity, setRarity] = useState('common')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const gridRef = useRef(null), detailRef = useRef(null)
  const visible = useMemo(() => filterItemDex(catalog, rarity, query, collection).map(item => getItemDexDisplay(item, collection)), [catalog, rarity, query, collection])
  const selected = visible.find(item => item.id === selectedId) ?? visible[0]
  const counts = useMemo(() => new Map(ITEM_RARITIES.map(tier => [tier.key,
    catalog.filter(item => item.rarity === tier.key).length])), [catalog])
  const resetScroll = () => {
    gridRef.current?.scrollTo({ top: 0 })
    detailRef.current?.scrollTo({ top: 0 })
  }
  const selectRarity = key => {
    setRarity(key); setQuery(''); setSelectedId(null); resetScroll()
  }

  return (
    <div className="item-dex">
      <nav className="item-dex__rarities" aria-label="아이템 등급 선택">
        {ITEM_RARITIES.map(tier => (
          <button type="button" key={tier.key} data-rarity={tier.key}
            className={'item-dex__rarity' + (tier.key === rarity ? ' item-dex__rarity--active' : '')}
            aria-pressed={tier.key === rarity} onClick={() => selectRarity(tier.key)}>
            <span className="item-dex__gem" aria-hidden="true">◆</span>
            <span>{tier.label}</span><span className="item-dex__count">{counts.get(tier.key)}</span>
          </button>
        ))}
      </nav>
      <section className="item-dex__browser" aria-label={getItemRarityLabel(rarity) + ' 등급 아이템'} data-rarity={rarity}>
        <header className="item-dex__toolbar">
          <h2>{getItemRarityLabel(rarity)} <span>{visible.length}종</span></h2>
          <input type="search" aria-label="아이템 이름 검색" placeholder="아이템 이름 검색" value={query}
            onChange={event => { setQuery(event.target.value); setSelectedId(null); resetScroll() }} />
        </header>
        <div className="item-dex__content">
          <div ref={gridRef} className="item-dex__grid" role="group" aria-label="아이템 목록">
            {visible.map(item => (
              <button type="button" key={item.id} className={'item-dex__card' + (selected?.id === item.id ? ' item-dex__card--selected' : '')}
                aria-label={item.known ? item.name : '미발견 아이템'} aria-pressed={selected?.id === item.id} onClick={() => { setSelectedId(item.id); detailRef.current?.scrollTo({ top: 0 }) }}>
                <span className="item-dex__art">{item.known ? <img src={item.imageUrl} alt="" loading="lazy" decoding="async" width="80" height="80" draggable="false" /> : <span className="item-dex__question" aria-hidden="true">?</span>}</span>
                <span className="item-dex__name">{item.known ? item.name : null}</span>
              </button>
            ))}
            {!visible.length && <p className="item-dex__empty">검색 결과가 없습니다.</p>}
          </div>
          {selected && (selected.known ? <aside className="item-dex__detail" aria-label="선택한 아이템 정보">
            <div className="item-dex__detail-art"><img src={selected.imageUrl} alt={selected.name} decoding="async" width="140" height="140" draggable="false" /></div>
            <div className="item-dex__detail-title"><span className="item-dex__badge">{getItemRarityLabel(selected.rarity)}</span><span>{selected.kind}</span>
              <h3>{selected.name}</h3></div>
            <div ref={detailRef} className="item-dex__effect" tabIndex="0" aria-label="아이템 효과">
              <p>{selected.description}</p>
              {selected.limit && <span className="item-dex__limit">{selected.limit}</span>}
            </div>
          </aside> : <aside className="item-dex__detail item-dex__detail--unknown" aria-label="미발견 아이템 정보">
            <span className="item-dex__question" aria-hidden="true">?</span><h3>미발견 아이템</h3>
          </aside>)}
        </div>
      </section>
    </div>
  )
}
