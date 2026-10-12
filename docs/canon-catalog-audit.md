# 2026-10-12 디지몬 타입·아이템 이미지 점검

총 512종의 타입을 점검했다. 공식 Digimon Encyclopedia에서 정확한 폼에 해당하는 505개 항목을 조회했다. 이 중 482개는 Attribute가 명시돼 있고, 23개 유아기·유년기 항목은 해당 값이 비어 있다. 별도 공식 항목을 확인하지 못한 알카디몬 6폼과 치비카메몬은 기존 게임 분류를 유지했다.

공식 원문 값과 폼별 디렉터리, 확인하지 못한 부분은 [digimon-reference-types.json](asset-sources/digimon-reference-types.json)에 기록했다. 온라인 요청 없이 재검사하려면 `npm run test:canon`을 실행한다.

## 분류 기준

게임의 `타입`은 공식 도감의 Attribute에 대응한다. Vaccine/Data/Virus/Free는 백신/데이터/바이러스/프리로 반영한다. 하이브리드체의 Variable은 기존 게임의 프리 상성 분류로 통일하며, 근거 파일에는 원문의 Variable을 그대로 남긴다. Unknown과 NO DATA는 불명으로 취급한다. 공식 값이 비어 있는 아기 디지몬은 기존 무/프리 분류를 보존한다.

화염·물·빛 등의 게임 `속성`은 별도의 전투 원소 체계이다. 공식 도감의 종족 Type(성기사형 등)을 백신/바이러스 분류와 혼동하지 않는다. 이번 변경에서 능력치, 진화 단계, 기술 위력은 변경하지 않았다.

## 타입 수정 28종

| 디지몬 | 이전 | 수정 | 공식 근거 |
| --- | --- | --- | --- |
| 가드로몬(골드) | 바이러스 | 프리 | [Free](https://digimon.net/reference_en/detail.php?directory_name=gardromon_gold) |
| 가름몬 | 불명 | 프리 | [Variable](https://digimon.net/reference_en/detail.php?directory_name=garummon) |
| 듀크몬[크림슨] | 백신 | 바이러스 | [Virus](https://digimon.net/reference_en/detail.php?directory_name=dukemoncrimsonmode) |
| 듀크몬[X항체] | 백신 | 바이러스 | [Virus](https://digimon.net/reference_en/detail.php?directory_name=dukemon_x) |
| 라센몬[격앙] | 바이러스 | 데이터 | [Data](https://digimon.net/reference_en/detail.php?directory_name=rasenmon_f) |
| 링스몬 | 백신 | 프리 | [Free](https://digimon.net/reference_en/detail.php?directory_name=lynxmon) |
| 매그너가루몬[SV] | 데이터 | 프리 | [Variable](https://digimon.net/reference_en/detail.php?directory_name=magnagarurumon) |
| 매그너몬 | 백신 | 프리 | [Free](https://digimon.net/reference_en/detail.php?directory_name=magnamon) |
| 머드프리지몬 | 불명 | 데이터 | [Data](https://digimon.net/reference_en/detail.php?directory_name=tuchidarumon) |
| 멧돼지몬 | 데이터 | 프리 | [Free](https://digimon.net/reference_en/detail.php?directory_name=boarmon) |
| 백사몬 | 백신 | 프리 | [Free](https://digimon.net/reference_en/detail.php?directory_name=quetzalmon) |
| 백조몬 | 백신 | 프리 | [Free](https://digimon.net/reference_en/detail.php?directory_name=swanmon) |
| 번개드라몬 | 데이터 | 프리 | [Free](https://digimon.net/reference_en/detail.php?directory_name=lighdramon) |
| 비트몬 | 백신 | 프리 | [Free](https://digimon.net/reference_en/detail.php?directory_name=bitmon) |
| 사수몬 | 백신 | 프리 | [Free](https://digimon.net/reference_en/detail.php?directory_name=sagittarimon) |
| 샤우트몬 | 불명 | 데이터 | [Data](https://digimon.net/reference_en/detail.php?directory_name=shoutmon) |
| 시프몬 | 백신 | 프리 | [Free](https://digimon.net/reference_en/detail.php?directory_name=sheepmon) |
| 아트라캅테리몬(청) | 백신 | 데이터 | [Data](https://digimon.net/reference_en/detail.php?directory_name=atlurkabuterimon-blue) |
| 왕펭귄몬 | 데이터 | 프리 | [Variable](https://digimon.net/reference_en/detail.php?directory_name=daipenmon) |
| 워매몬 | 프리 | 바이러스 | [Virus](https://digimon.net/reference_en/detail.php?directory_name=numemon) |
| 위그드라실 7D6 | 데이터 | 불명 | [Unknown](https://digimon.net/reference_en/detail.php?directory_name=yggdrasill7d6) |
| 토우몬 | 데이터 | 프리 | [Free](https://digimon.net/reference_en/detail.php?directory_name=shakkoumon) |
| 토토몬 | 백신 | 프리 | [Free](https://digimon.net/reference_en/detail.php?directory_name=opossummon) |
| 프라리몬 | 백신 | 프리 | [Free](https://digimon.net/reference_en/detail.php?directory_name=prairiemon) |
| 홀리드라몬 | 프리 | 백신 | [Vaccine](https://digimon.net/reference_en/detail.php?directory_name=holydramon) |
| 화염드라몬 | 데이터 | 프리 | [Free](https://digimon.net/reference_en/detail.php?directory_name=fladramon) |
| 황룡몬 | 데이터 | 불명 | [NO DATA](https://digimon.net/reference_en/detail.php?directory_name=huanglongmon) |
| 황소몬 | 백신 | 프리 | [Free](https://digimon.net/reference_en/detail.php?directory_name=bullmon) |

메탈그레이몬은 다른 폼을 가리키던 출처를 [주황색 백신 폼](https://digimon.net/reference_en/detail.php?directory_name=metalgreymon-v)으로 수정했다. 원본은 백신을 유지하며 [크로스워즈 폼](https://digimon.net/reference_en/detail.php?directory_name=metalgreymon)은 바이러스를 유지한다. 치비카메몬에는 카메몬의 공식 도감 링크를 사용하지 않는다. 퓨전 파이터즈 모델 출처는 외형 확인 근거일 뿐 공식 타입 확정 근거가 아니므로 별도 예외로 기록한다.

기존 모험을 불러올 때 플레이어, 보유 파티, 적, 지원 동료, 영입 대기 디지몬의 타입·원소 속성을 현재 종 데이터로 갱신한다. 장착품·인벤토리·진화 이력·HP 비율은 기존 저장 복구 규칙을 유지한다. 명예의 전당 같은 과거 기록 데이터는 이번 점검에서 서버를 일괄 수정하지 않았다.

## 아이템 이미지

기존 이미지 155개(모험 35, 진화 18, 카드 20, 기존 아이콘 82)를 4개 검수 페이지에서 직접 확인했다. 불의 비스트 스피릿에 불꽃의 휴먼 스피릿 그림이 연결된 오류를 확인해 수정했다. 나머지는 이번 육안 검수에서 추가 혼동을 확인하지 못했다. 이 검수는 모든 원작 아이콘의 출처를 새로 확정했다는 의미는 아니다.

[공식 하이브리드체·스피릿 설명](https://digimon.net/profile/report014/)에서 불의 비스트는 `img_kodai_01.png`, 휴먼은 `img_kodai_02.png`이다. 원본 비스트 PNG로 교체하고 SHA-256과 조회일을 `adventureItemArt.json`에 갱신했다. 기존 아이템 ID, 수량과 효과는 그대로 유지한다.

`verify-runtime.mjs`는 기존 모험·카드 이미지뿐 아니라 진화 아이템 18개도 원본 해시와 파일 형식을 검사한다. 모든 고정·무작위·진화 보상 이미지의 실제 로컬 파일을 회귀 검사한다. 전체 게임 다운로드 목록은 빌드에서 파일 해시로 갱신하므로 업데이트 시 수정 이미지가 포함된다.
