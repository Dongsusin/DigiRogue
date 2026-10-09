// Direction for the real models added in the third roster expansion.
// Motifs interpret each Digimon's form and abilities; choreography is original game art.
const shot = (template, backdrop, palette, kind, subtitle, extra = {}) => ({
  template, backdrop, palette, motif: { kind }, subtitle, ...extra,
})
const xros = (palette, subtitle, componentPalettes, variant, components) => shot('xros', 'blueprint', palette, 'assembly', subtitle, {
  callout: '디지크로스', sourcePalettes: componentPalettes,
  sourcePaletteByName: Object.fromEntries(components.map((name, index) => [name, componentPalettes[index]])),
  motif: { kind: 'assembly', variant },
})
const red = ['#ff4938', '#fff5c0', '#451627']
const blue = ['#36bbff', '#fff398', '#102e63']
const orange = ['#ffa834', '#fff7db', '#723408']
const gold = ['#ffd953', '#fffdf1', '#453224']
const steel = ['#53caff', '#ecffff', '#1b2862']
const alien = ['#bb6bff', '#b3fff8', '#251136']

export const EXPANSION_EVOLUTION_SIGNATURES = Object.freeze({
  에이션트볼케몬: shot('burst', 'inferno', ['#ff8734', '#fff6b6', '#532315'], 'magma', '태고의 화산이 깨어난다', { sourceSpin: .35 }),
  '매드레오몬[암드]': shot('mode', 'inferno', ['#d94d77', '#e3fdff', '#242a3b'], 'forge', '무장한 사자의 포효', { armor: true, sourceSpin: .3 }),
  바리스타몬: shot('mode', 'blueprint', blue, 'resonance', '중장갑에 울리는 비트', { armor: true, sourceSpin: .25 }),
  바스테몬: shot('dark', 'void', ['#e896dc', '#ffecb4', '#3b164a'], 'crescent', '고양이의 춤 · 매혹의 달', { sourceSpin: .5 }),
  블래스트몬: shot('mode', 'prism', ['#e4ad55', '#fcffff', '#385383'], 'crystal', '단단하게 응축되는 수정', { sourceSpin: .25 }),
  치비카메몬: shot('adventure', 'abyss', ['#4ce5ca', '#edffff', '#11548c'], 'tide', '작은 바다의 동료', { sourceSpin: .3 }),
  큐트몬: shot('adventure', 'heaven', ['#ff9cc7', '#fff7e9', '#853e73'], 'healing', '다정한 치유의 빛', { sourceSpin: .15 }),
  '사이버드라몬[크로스워즈]': shot('mode', 'grid', alien, 'plasma', '이계의 전투 데이터', { armor: true, sourceSpin: .25 }),
  왕펭귄몬: shot('spirit', 'prism', ['#75d9ff', '#ffd2e6', '#554288'], 'frost', '두 가지 빙결의 힘', { sourceSpin: .3 }),
  도루루몬: shot('adventure', 'celestial', orange, 'drill', '대지를 뚫는 드릴', { sourceSpin: .2 }),
  '그레이몬[크로스워즈]': shot('burst', 'inferno', ['#ff9948', '#c0efff', '#1d294e'], 'magma', '포효하는 전투룡', { motif: { kind: 'magma', variant: 'dragon' }, sourceSpin: .35 }),
  메일버드라몬: shot('mode', 'blueprint', ['#51c1ff', '#d9f8ff', '#233c71'], 'jet', '강철 날개의 비행', { armor: true, sourceSpin: .2 }),
  맘몬: shot('adventure', 'prism', ['#9bdfff', '#fff8de', '#3e5279'], 'frost', '설원에서 깨어난 고대 짐승', { motif: { kind: 'frost', variant: 'tundra' }, sourceSpin: .2 }),
  '메탈그레이몬[크로스워즈]': xros(steel, '용의 힘과 강철 날개', [orange, steel], 'wing', ['그레이몬[크로스워즈]', '메일버드라몬']),
  '메탈그레이몬[사이버런처]': xros(['#a37fff', '#efffff', '#25305e'], '거대한 포격 무장', [steel, alien], 'launcher', ['메탈그레이몬[크로스워즈]', '사이버드라몬[크로스워즈]']),
  모니터몬: shot('mode', 'grid', ['#78fda9', '#efffec', '#193933'], 'scan', '정보 수집 · 데이터 동기화', { sourceSpin: .05 }),
  파라오몬: shot('dark', 'cathedral', ['#f8c660', '#f6deff', '#4b1c69'], 'relic', '황금 관에서 깨어난 왕', { sourceSpin: .25 }),
  '샤우트몬[X2]': xros(red, '샤우트몬 · 바리스타몬', [red, blue], 'body', ['샤우트몬', '바리스타몬']),
  '샤우트몬[X3]': xros(['#ff7446', '#fff1a0', '#342341'], '세 동료의 전투 데이터', [red, orange], 'drill', ['샤우트몬[X2]', '도루루몬']),
  '샤우트몬[X4]': xros(['#ff4d36', '#fffbd9', '#36244e'], '승리를 잇는 스타 소드', [red, gold], 'sword', ['샤우트몬[X3]', '스타몬즈']),
  스패로우몬: shot('adventure', 'helix', ['#ffd658', '#f8ffde', '#29536f'], 'jet', '하늘을 가르는 황금 날개', { sourceSpin: .15 }),
  스타몬즈: shot('adventure', 'celestial', gold, 'stars', '한데 모이는 별들의 빛', { sourceSpin: .2 }),
  다크티라노몬: shot('burst', 'inferno', ['#65dcad', '#ffc283', '#263c40'], 'magma', '검은 용의 불꽃', { motif: { kind: 'magma', variant: 'dragon' }, sourceSpin: .35 }),
  유피테르몬: shot('radiant', 'celestial', ['#ffdf71', '#f8fcff', '#314774'], 'thunder', '하늘에서 내려오는 심판', { wings: 0, sourceSpin: .2 }),
  코에몬: shot('adventure', 'bloom', ['#9cea6b', '#fff09d', '#35613a'], 'forest', '숲속의 작은 명사수', { sourceSpin: .2 }),
  타겟몬: shot('adventure', 'grid', ['#ff9870', '#ffefb1', '#513d70'], 'target', '장난꾸러기의 새로운 표적', { sourceSpin: .3 }),
  바그라몬: shot('dark', 'void', ['#b589ec', '#ffd5be', '#312137'], 'soul', '영혼을 움켜쥐는 오른팔', { sourceSpin: .15 }),
  데크스몬: shot('dark', 'glitch', ['#e65af7', '#ffd2ed', '#34113b'], 'deletion', '프로세스 0 · 프로세스 F', { sourceSpin: .1 }),
  // This is a program reconstruction, not a fabricated biological evolution route.
  '위그드라실 7D6': shot('matrix', 'code', ['#97f4d8', '#f0ffff', '#274665'], 'program', '관리 프로그램 재구축', { callout: '데이터 재구축', sourceSpin: 0 }),
})
