# 진화 아이템 정책 — 2026-10-14

최종 요청에 따라 다음 정책을 적용했다. 디지몬 자체와 능력치·기술 위력·진화 레벨·육성 기준은 유지한다.

| 아이템 | 처리 |
| --- | --- |
| 에보류터 · 지드밀레니엄몬 | 마스터 유지 |
| 에보류터 · 얼티메이트카오스몬 | 마스터 유지 |
| 에보류터 · 알파몬[왕룡검] | 제거 |
| 에보류터 · 오그도몬 | 제거 |
| 그랑 킬러 | 로그 등급 |
| 드라몬 브레이커 | 로그 등급 |

알파몬[왕룡검]은 알파몬+오류우몬의 기존 조그레스칩 경로를 사용한다.
두 재료 모두 레벨 95와 영구 육성 기준을 충족해야 한다.
기존 진화 기억 스킬의 아이템 면제 규칙도 유지한다.

오그도몬은 리리스몬·마왕몬·발바몬 중 하나가 레벨 120과 영구 육성 기준을 충족하면
아이템 없이 일반 진화한다. 다른 선행 디지몬으로 연결을 넓히지 않는다.

제거한 두 전용 아이템은 보상과 아이템 도감에 나타나지 않는다.
구형 재고·발견 기록·중첩 보상 체크포인트·선택 대기 정보에서도 정리한다.
남은 다른 아이템의 ID·이미지·개수는 보존한다.
두 전용 아이템의 사용하지 않는 이미지도 제거했다.

## 검증

- 관련 진화·아이템 이미지·도감·저장·조그레스 검사 142개 통과.
- npm run test:evolution-investment: 최종 요청의 등급·제거·저장 이관과 기존 진화 기준을 검사한다.
- npm run build, 원본 및 dist 런타임 검사: 종료 코드 0.
- 실제 게임의 메인 → 도감 → 아이템 탭에서 마스터 두 아이템 유지, 로그 두 아이템 분류,
  제거 두 아이템의 전체 등급 부재와 구형 발견 기록 제거를 확인했다.
- 1440×900과 640×360에서 이미지 로딩·카드 선택·한글 등급 표시를 검사했다.
  키보드 방향키로 도감 탭을 바꾸는 흐름도 확인했다.
- 전체 검사 1003개 중 994개 통과, 기존 실패 6개, 에뮬레이터 검사 3개 건너뜀.
  기존 실패는 특수 의뢰 보상 4개, 삭제된 시너지 아이템 기대값 1개, 종 수를 512로 고정한
  기술 학습 기대값 1개로, 이번 변경 전 실패 목록과 동일하다.
- 전체 캠페인 연속 수동 플레이, 다른 브라우저 엔진·실물 기기 검사는 하지 않았다.

상세 명령·결과·실패 이름·변경 파일 목록:
.tmp-convert/evolution-item-tiers-2026-10-14/validation.json

## 변경 파일

- src/data/evolutionRules.js
- src/data/rosterExpansion7.json
- src/data/normalEvolutionRequirements.json
- src/data/itemIdentity.json
- src/data/itemArtworkOverrides.json
- src/progression/retiredCombatantData.js
- scripts/verify-evolution-investment.mjs
- scripts/verify-evolution-item-tiers.mjs
- package.json
- docs/evolution-investment-balance.md
- docs/evolution-item-policy.md
- public/items/evolution/unique/alphablade.webp — 삭제
- public/items/evolution/unique/ogudomon.webp — 삭제

## 테스트 서버

http://127.0.0.1:5174/.tmp-convert/all-digimon-test.html

전체 661종 획득, 현재 아이템 198개 발견, 테이머 스킬 최대 강화 테스트 프로필이다.
이번 변경은 로컬에만 적용했으며 배포하지 않았다.
