import './MainMenu.css'

const items = [
  { key: 'new-game', label: '새로하기', subtitle: 'NEW GAME' },
  { key: 'continue', label: '이어하기', subtitle: 'CONTINUE' },
  { key: 'skills', label: '스킬' },
  { key: 'town', label: '마을' },
  { key: 'dex', label: '도감' },
  { key: 'hall-of-fame', label: '명예의 전당' },
  { key: 'settings', label: '설정' },
]

function MenuIcon({ kind }) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'new-game' && <path d="M7 3.5 27 16 7 28.5Z" fill="currentColor" strokeWidth="1.5" />}
    {kind === 'continue' && <><path d="M7 3h12l7 7v19H7Z" /><path d="M19 3v8h7M12 16h9m-9 5h9" /></>}
    {kind === 'skills' && <><path d="m16 3 3.3 9.7L29 16l-9.7 3.3L16 29l-3.3-9.7L3 16l9.7-3.3Z" /><path d="m5 5 2 2m18-2-2 2M5 27l2-2m18 2-2-2" /></>}
    {kind === 'town' && <><path d="m2 15 14-12 14 12M6 12v17h20V12" /><path d="M12 29V18h8v11M10 13h12" /></>}
    {kind === 'dex' && <><path d="M16 7C11 2 5 3 2 5v22c4-2 9-2 14 2 5-4 10-4 14-2V5c-3-2-9-3-14 2Z" /><path d="M16 7v22" /></>}
    {kind === 'hall-of-fame' && <><path d="M9 4h14v9a7 7 0 0 1-14 0V4ZM9 7H4v5c0 4 3 6 7 6M23 7h5v5c0 4-3 6-7 6M16 20v7M10 28h12" /></>}
    {kind === 'settings' && <><path d="m12 3-1 4-3 2-4-1-2 5 3 3v3l-3 3 3 5 4-1 3 2 1 3h6l1-3 3-2 4 1 3-5-3-3v-3l3-3-2-5-4 1-3-2-1-4Z" /><circle cx="16" cy="17" r="5" /></>}
  </svg>
}

export default function MainMenu({ hasSaveData, currentKey, skillPoints, onSelect, onAction }) {
  return <aside className="menu-panel" aria-labelledby="main-menu-title">
    <h1 id="main-menu-title" className="menu-panel__title"><span className="menu-panel__emblem" aria-hidden="true" />메인 메뉴<span className="menu-panel__circuit" aria-hidden="true" /></h1>
    <nav className="menu-panel__list" aria-label="메인 메뉴">
      {items.map(item => {
        const disabled = item.key === 'continue' && !hasSaveData
        const current = !disabled && item.key === currentKey
        return <button
          key={item.key}
          type="button"
          className={['menu-item', item.subtitle ? 'menu-item--wide' : '', item.key === 'new-game' ? 'menu-item--primary' : '', current ? 'menu-item--current' : '', disabled ? 'menu-item--disabled' : ''].filter(Boolean).join(' ')}
          data-menu-key={item.key}
          aria-label={item.label}
          aria-describedby={item.key === 'skills' ? 'main-menu-skill-points' : undefined}
          disabled={disabled}
          onMouseEnter={event => {
            if (disabled) return
            onSelect(item.key)
            if (event.currentTarget.parentElement.contains(document.activeElement)) event.currentTarget.focus({ preventScroll: true })
          }}
          onFocus={() => onSelect(item.key)}
          onClick={() => onAction(item.key)}
        >
          <span className="menu-item__icon"><MenuIcon kind={item.key} /></span>
          <span className="menu-item__text"><span className="menu-item__label">{item.label}</span>{item.subtitle && <span className="menu-item__subtitle" aria-hidden="true">{item.subtitle}</span>}</span>
          {item.key === 'skills' && <small id="main-menu-skill-points" className="menu-item__skill-points" title={skillPoints + ' SP'}>{skillPoints} SP</small>}
          <svg className="menu-item__chevron" viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 3 7 7-7 7" /></svg>
        </button>
      })}
    </nav>
  </aside>
}
