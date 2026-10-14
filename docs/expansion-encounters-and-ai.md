# 추가 디지몬의 서식지·보스와 전술 AI

2026-10-14. 로컬 테스트에 적용. 배포·커밋·푸시는 하지 않았다.

## 반영 범위

- 확장 목록 150종을 모두 검사했다. 140종은 일반 서식지에 배치하고 10종은 지역 보스로 배치했다.
- 34개 맵 모두 새 디지몬이 등장한다. 각 종의 맵과 등장 구간을 명시했으며, 원래 있던 다른 종과 맵 연결은 보존했다.
- 자연 진화 계통 37개를 보스/라이벌에 연결했다. 각 진화 연결은 현재 플레이 가능한 진화 규칙으로 검증했다.
- 별도 지역 전설 보스 10개, 라이벌 조그레스 4개와 모드 전환 2개를 추가했다.
- 비최종 보스·라이벌의 전체 편성은 332개이며, 편성에 쓰이는 387종 모두 자신의 필살기와 유한 횟수 패턴을 가진다.
- 기존 200층 최종 보스의 순환 기술과 패턴, HP 구간 제한을 유지한다. 기존 공격 피해 계산은 1,200개 비교에서 일치했다.

## 맵 배치 예

| 지역 | 추가 계열 예 |
|---|---|
| 부트 화산·기어사바나·용정궁 | 코로나몬 → 파이라몬 → 플레어몬 → 아폴로몬 |
| 용의눈호수·네트의 바다·아시노 섬 | 크랩몬 → 가재드라몬 → 스콜피오몬 → 푸쿠몬 |
| 메탈 엠파이어·팩토리얼 에리어·다크 웹 | 코쿠와몬 → 메카노몬 → 탱크드라몬 → 다크드라몬 |
| 기어 포레스트·이블 포레스트·비틀랜드 | 플로라몬·레드베지몬·브롯사몬, 거미·곤충 계열 |
| 선공계·코즈믹 에리어·가디언 팰리스 | 아이기오몬·아이기오투스몬 홀리·유피테르몬 계열 |
| 겐시 대륙·사규산·코즈믹 에리어 | 효코몬 → 부라이몬 → 부텐몬 → 크로노몬 홀리 |
| 아이스 생츄어리·코퀴토스 | 스노우고부리몬·블루우가몬·맘몬·스컬맘몬 |
| 오버델 묘지·코덱 유적·황천 | 미이라몬·파라오몬·지옥 파수견 계열 |

위 표는 예시다. 전체 150종의 실제 배치는 src/data/expansionHabitats.json이 관리한다.
유아기는 초반, 성장·성숙 계열은 초중반, 완전체 이상은 후반 등장 구간을 사용한다.
마스터 아이템이나 조그레스에 해당하는 특수 개체 10종은 일반 랜덤 출현에서 제외하고,
각자의 지역과 후반 스테이지에서 보스로 만날 수 있게 했다.

## 종별 패턴 예

공식 도감의 설정과 기술을 참고했고, 발동 조건·확률·수치는 팬게임 규칙이다.
기존에 내려받은 공식 프로필 원문을 확인했다
(.tmp-convert/attack-fx-2026-10-13/references.json).

- 티아루도몬의 얼음 방패, 라이지루도몬의 전자 장벽, 브리웨루드라몬의 불꽃 장벽.
- 탱크드라몬은 메카노몬을 한 번 증원하고 아라크네몬은 코스파이더몬을 한 번 부른다. 살아 있는 적은 최대 두 마리다.
- 아이기오투스몬 모드는 용족 갑옷·기계 집약·식물 포박·데이터 침식·천사족 정화로 구분했다.
- 유피테르몬 래스 모드의 광역 마비, 크로노몬 홀리의 시공 복원, 디스트로이의 시간 방해.
- 그레이스노바몬의 태양과 달의 공명, 볼토바우타몬의 악마의 교향곡, 좀비플루토몬의 데이터 흡수.
- 그레이스노바몬·볼토바우타몬·카오스몬·제트메르바몬의 라이벌 조그레스는 실제 두 재료가 생존해야 발동한다.

일반 패턴은 해당 턴의 공격을 대신한다. 진화·조그레스의 기존 행동 예외는 유지했다.
사용 완료 상태와 보류 중인 패턴은 저장/이어하기에서도 유지된다.
새 공격 모션을 임의 제작하지 않고, 기존 네이티브 모션과 기술 이펙트를 사용한다.

## AI 판단

src/battle/tacticalAI.js는 기술과 대상을 함께 평가한다.

- 타입·속성 상성, 공격/특공과 방어/특방, 화상, 장착 아이템, 패시브, 맵 환경, 방벽.
- 명중률과 최소 피해를 고려한 확실한 마무리, 쿨다운 및 공용 쿨다운.
- 전체 공격과 단일 공격의 대상별 효과.
- 회복·부활·상태 해제의 실제 아군 대상, 상태 면역과 능력치 하락 방어.
- 실제 주력 기술에 맞는 강화, 속도 역전 여부, 이미 걸린 강화·방어 중복 방지.
- 두 적의 확실한 마무리 및 같은 아군에 대한 회복 중복 배정 방지.
- 현재 전투에 보이는 개체만 평가한다. 플레이어가 선택한 명령·벤치·미공개 미래 형태는 읽지 않는다.
- 지역 지원 동료도 같은 상성 평가를 사용하되, 기존 정책대로 공격만 자동 사용한다.
- 최종 보스의 지정된 기술 순환을 유지한다.

피해 예측과 실제 전투는 src/battle/attackDamage.js와 App의 공통 계산을 사용한다.
곱셈·버림 순서까지 보존하며, 예측 중 난수 소비나 상태 변경은 하지 않는다.

600개 동일 조건 공격 선택 비교에서는 이전 AI보다 유효 기대 피해가 약 9.4% 증가했고,
확실한 마무리 선택은 45회에서 56회로 증가했다.
이 비교는 한 번의 공격 선택 평가이며, 전체 모험 승률이나 클리어 확률의 측정이 아니다.

## 검사 명령과 한계

- npm run test:ai
- npm run test:encounters
- npm run test:bosses
- node --test scripts/verify-regional-support.mjs scripts/verify-matchup-balance.mjs
- node scripts/assets/apply-expansion-habitats.mjs --check
- npm run build
- node scripts/verify-runtime.mjs
- node scripts/verify-runtime.mjs --dist

최종 실행 결과와 브라우저 증거는
.tmp-convert/encounters-ai-2026-10-14/validation.json을 확인한다.

전체 검사에는 이전 작업부터 실패하던 6개가 있다:
특수 의뢰의 이전 진화 아이템 기대값 4개, 삭제된 시너지 아이템 기대값 1개,
종 수를 512로 고정한 기술 학습 기대값 1개. 이번 변경과 관련된 검사에서는 새 실패가 없다.
인증·DB 규칙 에뮬레이터 검사 3개는 에뮬레이터가 없어 건너뛴다.
전체 200층 연속 수동 플레이와 모든 기기의 수동 화면 검사는 하지 않았다.

## 변경 파일

- data/map.json
- src/data/expansionHabitats.json
- src/data/expansionEncounters.js
- src/data/expansionEncounterPatterns.js
- src/data/regionalBossProfiles.js
- src/data/bossProfiles.js
- src/data/rivalVariants.js
- src/data/encounterPatterns.js
- src/data/encounterPatternRoster.json
- src/battle/bossEncounters.js
- src/battle/rivalEncounters.js
- src/battle/tacticalAI.js
- src/battle/attackDamage.js
- src/balance/combat.js
- src/App.jsx
- scripts/lib/expansion-habitats.mjs
- scripts/assets/apply-expansion-habitats.mjs
- scripts/assets/register-expansion7.mjs
- scripts/lib/battle-engine-fixture.mjs
- scripts/verify-boss-variety.mjs
- scripts/verify-encounter-patterns.mjs
- scripts/verify-regional-support.mjs
- scripts/verify-expansion-encounters.mjs
- scripts/verify-tactical-ai.mjs
- package.json
- docs/expansion-encounters-and-ai.md

## 로컬 테스트

- 전체 661종·아이템 200개 발견·테이머 스킬 최대:
  http://127.0.0.1:5174/.tmp-convert/all-digimon-test.html
- 추가 150종만 표시·시작 코스트 0·최대 8마리:
  http://127.0.0.1:5174/.tmp-convert/added-digimon-test.html

테스트 저장은 기존 개인/계정 저장과 다른 네임스페이스에 기록한다.
이미 진행 중인 테스트 저장은 유지하고, 최대 스킬 시드만 이번 테스트에 맞춰 한 번 다시 적용한다.
