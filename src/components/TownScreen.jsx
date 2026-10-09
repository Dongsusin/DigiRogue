import { useEffect, useState } from 'react'
import { TOWN_BUILDINGS, TOWN_RESIDENTS, getTownCapacity, getTownProsperity, getTownUpgrade,
  getTownRecruitment, townBuildingBenefit, getTownResidentView, maskTownResidentNames } from '../progression/townProgress.js'
import { REGIONAL_SUPPORT_PROFILES } from '../data/regionalSupportProfiles.js'
import { getDigimonThumbnailUrl } from '../data/digimonModels.js'
import './TownScreen.css'

function TownGlyph({ kind }) {
  const paths = {
    hall: 'M3 11 12 3l9 8M5 10v11h14V10M10 21v-7h4v7',
    farm: 'M12 21V9M12 15C3 16 3 7 3 7s9-1 9 8ZM12 10C12 3 21 3 21 3s0 9-9 9',
    egg: 'M20 15c0 5-4 7-8 7s-8-2-8-7S8 2 12 2s8 8 8 13ZM8 14l3-3 3 3 3-3',
    clinic: 'M8 3h8v5h5v8h-5v5H8v-5H3V8h5Z',
    workshop: 'm14 4 1 5 5 1M14 4a7 7 0 0 0-8 9l-4 5 4 4 5-5a7 7 0 0 0 9-8M5 18l1 1',
    market: 'M4 10v11h16V10M2 10l3-7h14l3 7M3 10c0 4 5 4 5 0 0 4 8 4 8 0 0 4 5 4 5 0M9 21v-6h6v6',
    data: 'm12 2 9 5v10l-9 5-9-5V7ZM3 7l9 5 9-5M12 12v10',
    token: 'M12 2 21 7v10l-9 5-9-5V7ZM8 12l3 3 5-6',
    people: 'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 22v-4c0-5 12-5 12 0v4M17 4a4 4 0 0 1 0 8M18 15c4 0 4 3 4 7',
    trust: 'M12 21S2 15 2 8c0-6 7-7 10-2 3-5 10-4 10 2 0 7-10 13-10 13Z',
    supply: 'M3 8h18v13H3ZM2 4h20v4H2ZM12 4v17',
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[kind] ?? paths.hall} /></svg>
}
const tabs = [{id:'buildings',label:'마을',icon:'hall'},{id:'residents',label:'주민',icon:'people'},{id:'trust',label:'지역 신뢰',icon:'trust'},{id:'support',label:'출발 지원',icon:'supply'}]
const portrait = name => <img src={getDigimonThumbnailUrl(name)} alt="" loading="lazy" decoding="async" />

function ResidentPortrait({ resident }) {
  return resident.known ? portrait(resident.portraitName) :
    <div className="town-unknown-portrait" role="img" aria-label="아직 만나지 않은 주민">?</div>
}

export default function TownScreen({ town, trust, onAction, onBack }) {
  const [tab, setTab] = useState('buildings')
  const [selected, setSelected] = useState('farm')
  const [residentFilter, setResidentFilter] = useState('all')
  const [notice, setNotice] = useState(null)
  useEffect(() => {
    const back = event => { if (event.key === 'Escape' && !event.repeat) { event.preventDefault(); onBack() } }
    window.addEventListener('keydown', back)
    return () => window.removeEventListener('keydown', back)
  }, [onBack])
  const act = command => { const result = onAction(command); setNotice({ ok: result.ok, text: result.message ?? result.reason }) }
  const building = TOWN_BUILDINGS.find(entry => entry.id === selected)
  const level = town.buildings[selected]
  const upgrade = getTownUpgrade(town, selected)
  const keeper = building.residents.find(name => town.residents.includes(name)) ?? building.keeper
  const keeperView = getTownResidentView(town, trust, keeper)
  const residentText = text => maskTownResidentNames(town, trust, text)
  const residents = TOWN_RESIDENTS.map(resident => ({ id: resident.name, ...getTownResidentView(town, trust, resident.name), offer: getTownRecruitment(town, trust, resident.name) }))
    .filter(resident => residentFilter === 'all' || (residentFilter === 'joined' ? resident.joined : resident.known && resident.offer.ok))
    .sort((a,b) => Number(b.joined)-Number(a.joined) || Number(b.known)-Number(a.known) ||
      (a.known && b.known ? Number(b.offer.ok)-Number(a.offer.ok) || b.offer.bestTrust-a.offer.bestTrust : 0))
  const regionCount = REGIONAL_SUPPORT_PROFILES.filter(region => (trust.regions[region.mapName] ?? 0) >= 2).length
  const chosen = TOWN_BUILDINGS.find(entry => entry.id === town.selectedSupport)
  return <section className="town-screen" aria-label="마을 관리">
    <header className="town-screen__header">
      <button type="button" className="town-back" onClick={onBack} aria-label="마을에서 메인 화면으로">‹ 뒤로</button>
      <div className="town-screen__title"><small>DIGITAL TOWN</small><h1>시작의 마을</h1><span>번영도 {getTownProsperity(town)} · 회관 Lv.{town.buildings.hall}</span></div>
      <div className="town-resources">
        <div title="전투 승리와 이벤트 성공으로 획득"><TownGlyph kind="data" /><span>건설 데이터<strong>{town.materials.toLocaleString()}</strong></span></div>
        <div title="10단계 승리와 이벤트 성공으로 획득"><TownGlyph kind="token" /><span>교류 증표<strong>{town.tokens.toLocaleString()}</strong></span></div>
      </div>
    </header>
    <nav className="town-tabs" aria-label="마을 메뉴">{tabs.map(entry => <button type="button" key={entry.id} aria-current={tab===entry.id ? 'page' : undefined} onClick={()=>{setTab(entry.id);setNotice(null)}}><TownGlyph kind={entry.icon}/>{entry.label}{entry.id==='residents' && <small>{town.residents.length}/{getTownCapacity(town)}</small>}</button>)}</nav>
    <div className="town-screen__body">
      {tab === 'buildings' && <div className="town-buildings">
        <div className="town-map" aria-label="마을 시설 지도">
          <div className="town-map__caption"><span>우리 디지몬의 작은 터전</span><strong>주민 {town.residents.length}명 · 교류 지역 {regionCount}곳</strong></div>
          {TOWN_BUILDINGS.map(entry => <button type="button" className={['town-pin',selected===entry.id?'town-pin--selected':'',town.buildings[entry.id]?'':'town-pin--empty'].join(' ')} style={{left:entry.x+'%',top:entry.y+'%'}} key={entry.id} onClick={()=>{setSelected(entry.id);setNotice(null)}} aria-pressed={selected===entry.id} aria-label={entry.name+' 선택'}><TownGlyph kind={entry.icon}/><span>{entry.name}</span><small>{town.buildings[entry.id] ? 'Lv.'+town.buildings[entry.id] : '건설 대기'}</small></button>)}
          <div className="town-map__legend"><i/>건설 완료 <i className="empty"/>건설 대기</div>
        </div>
        <article className="town-detail town-scroll" aria-label="시설 정보" tabIndex={0}>
          <div className="town-detail__heading"><TownGlyph kind={building.icon}/><div><small>{level ? '운영 중' : '새 시설'} · {selected==='hall'?'마을 중심':'출발 지원'}</small><h2>{building.name}</h2></div><b>Lv.{level}</b></div>
          <div className={'town-keeper '+(town.residents.includes(keeper)?'':'town-keeper--absent')}><ResidentPortrait resident={keeperView}/><div><small>담당 주민</small><strong>{keeperView.name}</strong><span>{town.residents.includes(keeper)?'마을에서 함께 지내고 있어요.':keeperView.known ? '지역 신뢰를 쌓아 영입하세요.' : '모험에서 먼저 만나 보세요.'}</span></div></div>
          <p>{residentText(building.description)}</p>
          <div className="town-benefit"><small>현재 혜택</small><strong>{townBuildingBenefit(selected,level)}</strong></div>
          {level < 3 && <><div className="town-benefit town-benefit--next"><small>다음 확장 · Lv.{level+1}</small><strong>{townBuildingBenefit(selected,level+1)}</strong></div><div className="town-cost"><span>건설 데이터 <b>{upgrade.materials}</b></span><span>교류 증표 <b>{upgrade.tokens}</b></span></div></>}
          <button type="button" className="town-primary" disabled={!upgrade.ok} onClick={()=>act({type:'upgrade',buildingId:selected})}>{level>=3?'최대 확장 완료':level?'확장하기':'건설하기'}</button>
          {!upgrade.ok && level<3 && <p className="town-requirement">{residentText(upgrade.reason)}</p>}
          {selected !== 'hall' && level > 0 && <button type="button" className="town-secondary" disabled={town.selectedSupport===selected} onClick={()=>act({type:'support',buildingId:selected})}>{town.selectedSupport===selected?'출발 지원 선택됨':'출발 지원으로 선택'}</button>}
        </article>
      </div>}
      {tab === 'residents' && <div className="town-list-panel">
        <div className="town-section-heading"><div><h2>마을 주민</h2><p>연결 지역 신뢰도 2 이상 · 교류 증표 2개로 영입</p></div><label>표시<select value={residentFilter} onChange={event=>setResidentFilter(event.target.value)}><option value="all">전체 주민</option><option value="available">영입 가능</option><option value="joined">함께 사는 주민</option></select></label></div>
        <div className="town-residents town-scroll" tabIndex={0}>{residents.map(resident =>
          <article className={'town-resident '+(resident.joined?'town-resident--joined':resident.known?'':'town-resident--unknown')} key={resident.id}>
            <div className="town-resident__portrait"><ResidentPortrait resident={resident}/><span>{resident.joined?'주민':!resident.known?'미발견':resident.offer.ok?'영입 가능':'교류 중'}</span></div>
            <h3>{resident.name}</h3><strong>{resident.known ? resident.role : '미발견 주민'}</strong>
            <p>{resident.known ? resident.homes.join(' · ') : '모험에서 만나 보세요.'}</p>
            <div className="town-resident__trust">지역 신뢰 <b>{resident.known ? resident.offer.bestTrust+'/3' : '?'}</b></div>
            <button type="button" className="town-secondary" disabled={!resident.known || !resident.offer.ok} onClick={()=>act({type:'recruit',name:resident.id})}>{resident.joined?'함께 살고 있어요':resident.known?'영입 · 증표 2':'미발견'}</button>
            {resident.known && !resident.joined && !resident.offer.ok && <small className="town-requirement">{resident.offer.reason}</small>}
          </article>)}{!residents.length && <div className="town-empty">지금 영입할 수 있는 주민이 없습니다.<span>모험에서 지역 의뢰를 돕고 신뢰를 쌓아 보세요.</span></div>}</div>
        <p className="town-subnote">주민 영입은 마을 시설에 적용됩니다. 시작 디지몬의 해금 조건과 코스트는 그대로 유지됩니다.</p>
      </div>}
      {tab === 'trust' && <div className="town-list-panel"><div className="town-section-heading"><div><h2>지역과 맺은 인연</h2><p>의뢰 성공으로 신뢰가 오르고, 일반 의뢰 실패로 감소합니다.</p></div><strong>{regionCount} / {REGIONAL_SUPPORT_PROFILES.length} 교류 지역</strong></div><div className="town-regions town-scroll" tabIndex={0}>{[...REGIONAL_SUPPORT_PROFILES].sort((a,b)=>(trust.regions[b.mapName]??0)-(trust.regions[a.mapName]??0)).map(region => {const value=trust.regions[region.mapName]??0;const resident=getTownResidentView(town, trust, region.name);return <article className="town-region" key={region.id}><ResidentPortrait resident={resident}/><div><h3>{region.mapName}</h3><span>{resident.name}{town.residents.includes(region.name)?' · 마을 주민':''}</span><div className="town-trust-meter" aria-label={'신뢰도 '+value+'/3'}>{[1,2,3].map(n=><i key={n} className={value>=n?'filled':''}/>)}<b>{value}/3</b></div></div><small className={value>=2?'town-status--ready':''}>{value>=2?'보스전 지원 가능':'신뢰 형성 중'}</small></article>})}</div><p className="town-subnote">지역 신뢰는 모험 종료 후에도 유지됩니다. 특수 의뢰는 신뢰도에 영향을 주지 않습니다.</p></div>}
      {tab === 'support' && <div className="town-list-panel"><div className="town-section-heading"><div><h2>다음 모험의 출발 지원</h2><p>건설한 시설 중 하나를 선택하세요.</p></div><strong>선택 {chosen?chosen.name:'없음'}</strong></div><div className="town-supports town-scroll" tabIndex={0}>{TOWN_BUILDINGS.filter(entry=>entry.id!=='hall').map(entry => {const built=town.buildings[entry.id]>0;const active=town.selectedSupport===entry.id;return <article className={'town-support '+(active?'town-support--selected':'')} key={entry.id}><TownGlyph kind={entry.icon}/><small>{built?'Lv.'+town.buildings[entry.id]:'건설 필요'}</small><h3>{entry.name}</h3><p>{built?townBuildingBenefit(entry.id,town.buildings[entry.id]):residentText(entry.description)}</p><button type="button" className="town-secondary" disabled={!built} aria-pressed={active} onClick={()=>act({type:'support',buildingId:entry.id})}>{active?'선택됨':'이 지원 선택'}</button></article>})}<article className={'town-support '+(town.selectedSupport==='none'?'town-support--selected':'')}><TownGlyph kind="supply"/><small>기본 출발</small><h3>지원 없이 출발</h3><p>마을 보급 없이 모험을 시작합니다.</p><button type="button" className="town-secondary" aria-pressed={town.selectedSupport==='none'} onClick={()=>act({type:'support',buildingId:'none'})}>{town.selectedSupport==='none'?'선택됨':'지원 해제'}</button></article></div><p className="town-subnote">새 캐주얼·하드·무한 모험에 적용됩니다. 진행 중인 모험과 데일리 모드에는 적용되지 않습니다.</p></div>}
    </div>
    <footer className="town-footer"><span>출발 지원 <b>{chosen?chosen.name:'선택 없음'}</b></span><span>승리 +5 데이터 · 10단계 승리 +15 데이터 / 증표 1 · 이벤트 성공 +20 데이터 / 증표 1</span></footer>
    {notice && <div className={'town-notice '+(notice.ok?'':'town-notice--error')} role={notice.ok?'status':'alert'}>{notice.text}<button type="button" aria-label="마을 알림 닫기" onClick={()=>setNotice(null)}>×</button></div>}
  </section>
}
