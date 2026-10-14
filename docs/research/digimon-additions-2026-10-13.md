# 디지로그 추가 디지몬 조사 — 2026-10-13

현재 모델 목록 512개와 공개 자료를 비교했다. **255개 추가·재검토 후보(모드·형태 포함)**를 정리했으며, 이 중 **224개는 현재 목록에 없는 신규 후보**, **31개는 과거 공격 모션 문제로 제외한 디지몬의 재검토 후보**다. 이는 게임에 바로 추가할 수 있다고 판정한 수가 아니다.

**108개 후보**는 타임 스트레인저 GLB에서 원본 대기·공격·피격·다운 모션 메타데이터를 확인했다. 나머지 **147개**는 공개 모델 목록에서 존재만 확인했으며 필수 모션을 검증하지 않았다. **167개**는 공식 한국어 도감 이름과 세대·유형·속성도 대조했다.

## 검증 기준과 한계

- 현재 manifest의 이름·영문명·모델 slug와 별칭을 대조해 중복을 제거했다. 기존 모델의 게임만 바뀐 경우는 신규 수에 넣지 않았다.
- 임의 제작 attack으로 제외된 디지몬은 새 원작 모션 자료가 확인된 경우만 우선 재검토한다. 기존과 같은 자료만 있는 경우는 보류다.
- GLB JSON에서 실제 애니메이션 채널이 있는 bn01(대기), ba/bs(공격), bd01(피격), bd02(다운)를 확인했다. 원본 다운을 사망 연출에 사용하는 것은 별도 연출 결정이며, 독립 die 클립을 확인했다는 뜻은 아니다.
- 공개 뷰어에서 코로나몬의 원작 Special 01 선택·재생과 네 역할 목록을 확인했다. 108개 전부의 동작을 눈으로 완주 검증한 것은 아니다.
- Nuffle 제작자 문서는 자체 보유 게임에서 모델을 추출하는 흐름을 안내한다. 뷰어 공개와 원본 모델 재배포 허가는 별도다.
- TMR 상세 페이지 일부는 403으로 접근되지 않았다. 목록의 모델 존재 확인과 다운로드 성공을 구분했다.
- 아래 활용·편성 추천은 이번 조사에 따른 게임 디자인 제안이다. 진화 연결은 확정된 공식 단일 진화 트리를 뜻하지 않는다.
- 영문 Scorpiomon은 이 자료에서 アノマロカリモン이다. 스콜피오몬으로 기록했으며 전갈몬 スコピオモン과 혼동하지 않았다.

## 먼저 검토할 40개

| 후보 | 공식 세대 | 원작 모션 | 활용 제안 |
|---|---|---|---|
| [아이기오투스몬 (Aegiochusmon)](https://nuffle.me/dsts-viewer?m=aegiochusmon) | 완전체 | 대기·공격·피격·다운 메타데이터 확인 | 일리아스·올림포스 |
| [아이기오투스몬[블루] (Aegiochusmon: Blue)](https://nuffle.me/dsts-viewer?m=aegiochusmon-blue) | 공식 표기 재확인 | 대기·공격·피격·다운 메타데이터 확인 | 일리아스·올림포스 |
| [아이기오투스몬[다크] (Aegiochusmon: Dark)](https://nuffle.me/dsts-viewer?m=aegiochusmon-dark) | 공식 표기 재확인 | 대기·공격·피격·다운 메타데이터 확인 | 일리아스·올림포스 |
| [아이기오투스몬[그린] (Aegiochusmon: Green)](https://nuffle.me/dsts-viewer?m=aegiochusmon-green) | 공식 표기 재확인 | 대기·공격·피격·다운 메타데이터 확인 | 일리아스·올림포스 |
| [아이기오투스몬[홀리] (Aegiochusmon: Holy)](https://nuffle.me/dsts-viewer?m=aegiochusmon-holy) | 공식 표기 재확인 | 대기·공격·피격·다운 메타데이터 확인 | 일리아스·올림포스 |
| [아이기오몬 (Aegiomon)](https://nuffle.me/dsts-viewer?m=aegiomon) | 성숙기 | 대기·공격·피격·다운 메타데이터 확인 | 일리아스·올림포스 |
| [아루다몬 (Aldamon)](https://nuffle.me/dsts-viewer?m=aldamon) | 하이브리드체 | 대기·공격·피격·다운 메타데이터 확인 | 하이브리드 진화 |
| [아폴로몬 (Apollomon)](https://nuffle.me/dsts-viewer?m=apollomon) | 궁극체 | 대기·공격·피격·다운 메타데이터 확인 | 일리아스·올림포스 |
| [베르스타몬 (BelleStarmon)](https://nuffle.me/dsts-viewer?m=beelstarmon) | 궁극체 | 대기·공격·피격·다운 메타데이터 확인 | 총격·검술·성역 |
| [베오울프몬 (BeoWolfmon)](https://nuffle.me/dsts-viewer?m=beowolfmon) | 공식 표기 재확인 | 대기·공격·피격·다운 메타데이터 확인 | 하이브리드 진화 |
| [부라이몬 (Buraimon)](https://nuffle.me/dsts-viewer?m=buraimon) | 성숙기 | 대기·공격·피격·다운 메타데이터 확인 | 총격·검술·성역 |
| [부텐몬 (Butenmon)](https://nuffle.me/dsts-viewer?m=butenmon) | 완전체 | 대기·공격·피격·다운 메타데이터 확인 | 총격·검술·성역 |
| [칼마라몬 (Calmaramon)](https://nuffle.me/dsts-viewer?m=calmaramon) | 공식 표기 재확인 | 대기·공격·피격·다운 메타데이터 확인 | 하이브리드 진화 |
| [크로노몬: 디스트로이 모드 (Chronomon Destroy Mode)](https://nuffle.me/dsts-viewer?m=chronomon-dm) | 궁극체 | 대기·공격·피격·다운 메타데이터 확인 | 희귀 보스·특수 진화 |
| [크로노몬: 홀리 모드 (Chronomon Holy Mode)](https://nuffle.me/dsts-viewer?m=chronomon-hm) | 궁극체 | 대기·공격·피격·다운 메타데이터 확인 | 희귀 보스·특수 진화 |
| [클라비스엔젤몬 (ClavisAngemon)](https://nuffle.me/dsts-viewer?m=clavisangemon) | 궁극체 | 대기·공격·피격·다운 메타데이터 확인 | 총격·검술·성역 |
| [코로나몬 (Coronamon)](https://nuffle.me/dsts-viewer?m=coronamon) | 성장기 | 대기·공격·피격·다운 메타데이터 확인 | 시작 파트너·성장기 |
| [다크드라몬 (Darkdramon)](https://nuffle.me/dsts-viewer?m=darkdramon) | 궁극체 | 대기·공격·피격·다운 메타데이터 확인 | 공장·병기 |
| [디그몬 (Digmon)](https://nuffle.me/dsts-viewer?m=digmon) | 아머체 | 대기·공격·피격·다운 메타데이터 확인 | 아머 진화 |
| [파이라몬 (Firamon)](https://nuffle.me/dsts-viewer?m=firamon) | 성숙기 | 대기·공격·피격·다운 메타데이터 확인 | 일리아스·올림포스 |
| [플레어몬 (Flaremon)](https://nuffle.me/dsts-viewer?m=flaremon) | 완전체 | 대기·공격·피격·다운 메타데이터 확인 | 일리아스·올림포스 |
| [플로라몬 (Floramon)](https://nuffle.me/dsts-viewer?m=floramon) | 성장기 | 대기·공격·피격·다운 메타데이터 확인 | 시작 파트너·성장기 |
| [기자몬 (Gizamon)](https://nuffle.me/dsts-viewer?m=gizamon) | 성장기 | 대기·공격·피격·다운 메타데이터 확인 | 시작 파트너·성장기 |
| [그레이스노바몬 (GraceNovamon)](https://nuffle.me/dsts-viewer?m=gracenovamon) | 궁극체 | 대기·공격·피격·다운 메타데이터 확인 | 일리아스·올림포스 |
| [건드라몬 (Gundramon)](https://nuffle.me/dsts-viewer?m=gundramon) | 궁극체 | 대기·공격·피격·다운 메타데이터 확인 | 총격·검술·성역 |
| [호루스몬 (Halsemon)](https://nuffle.me/dsts-viewer?m=halsemon) | 아머체 | 대기·공격·피격·다운 메타데이터 확인 | 아머 진화 |
| [효코몬 (Hyokomon)](https://nuffle.me/dsts-viewer?m=hyokomon) | 성장기 | 대기·공격·피격·다운 메타데이터 확인 | 시작 파트너·성장기 |
| [점보가메몬 (JumboGamemon)](https://nuffle.me/dsts-viewer?m=jumbogamemon) | 궁극체 | 대기·공격·피격·다운 메타데이터 확인 | 바다·수중 |
| [코쿠와몬 (Kokuwamon)](https://nuffle.me/dsts-viewer?m=kokuwamon) | 성장기 | 대기·공격·피격·다운 메타데이터 확인 | 시작 파트너·성장기 |
| [코테몬 (Kotemon)](https://nuffle.me/dsts-viewer?m=kotemon) | 성장기 | 대기·공격·피격·다운 메타데이터 확인 | 시작 파트너·성장기 |
| [메디벌듀크몬 (MedievalGallantmon)](https://nuffle.me/dsts-viewer?m=medievalgallantmon) | 궁극체 | 대기·공격·피격·다운 메타데이터 확인 | 총격·검술·성역 |
| [메르바몬 (Mervamon)](https://nuffle.me/dsts-viewer?m=mervamon) | 궁극체 (크로스워즈) | 대기·공격·피격·다운 메타데이터 확인 | 추가 조사 후보 |
| [네페르티몬 (Nefertimon)](https://nuffle.me/dsts-viewer?m=nefertimon) | 아머체 | 대기·공격·피격·다운 메타데이터 확인 | 아머 진화 |
| [패럴렐몬 (Parallelmon)](https://nuffle.me/dsts-viewer?m=parallelmon) | 궁극체 | 대기·공격·피격·다운 메타데이터 확인 | 희귀 보스·특수 진화 |
| [페가수스몬 (Pegasusmon)](https://nuffle.me/dsts-viewer?m=pegasusmon) | 아머체 | 대기·공격·피격·다운 메타데이터 확인 | 아머 진화 |
| [펭귄몬 (Penguinmon)](https://nuffle.me/dsts-viewer?m=penmon) | 성장기 | 대기·공격·피격·다운 메타데이터 확인 | 시작 파트너·성장기 |
| [라나몬 (Ranamon)](https://nuffle.me/dsts-viewer?m=lanamon) | 하이브리드체 | 대기·공격·피격·다운 메타데이터 확인 | 하이브리드 진화 |
| [수리몬 (Shurimon)](https://nuffle.me/dsts-viewer?m=shurimon) | 아머체 | 대기·공격·피격·다운 메타데이터 확인 | 아머 진화 |
| [잠수몬 (Submarimon)](https://nuffle.me/dsts-viewer?m=submarimon) | 아머체 | 대기·공격·피격·다운 메타데이터 확인 | 아머 진화 |
| [탱크드라몬 (Tankdramon)](https://nuffle.me/dsts-viewer?m=tankdramon) | 완전체 | 대기·공격·피격·다운 메타데이터 확인 | 공장·병기 |

## 다양성을 늘리는 구성 제안

- 코로나몬·파이라몬·플레어몬·아폴로몬을 우선 검토하면 불꽃 계통의 육성 분기가 늘어난다. 기존 디아나몬과 그레이스노바몬의 합체 분기를 구성하는 방안도 있다. [공식 그레이스노바몬 설정](https://digimon.net/reference_ko/detail.php?directory_name=gracenovamon)
- 효코몬·부라이몬·부텐몬은 새 시작 파트너와 검술·조류 계통을 구성하기 좋다. 크로노몬 HM/DM은 높은 난도의 마지막 분기나 보스 후보로 검토한다.
- 수리몬·잠수몬·디그몬·네페르티몬·페가수스몬·호루스몬은 기존 디지에그·아머 진화 시스템의 선택지를 확장하기 좋다.
- 아루다몬·베오울프몬·라나몬·칼마라몬은 원작 모션 자료가 있으며 하이브리드 진화의 공백을 메우는 후보다. 다른 스피릿 계통은 원본 공격·다운 모션 검사 후 연결한다.
- 델타몬·스파이더몬·스나이몬·키위몬·쉘몬·가와파몬·모털몬·위치몬은 보스에 편중되지 않고 맵의 일반 적·이벤트 주민·지역별 편성을 넓히기 좋다.
- 코만드라몬·실즈드라몬·탱크드라몬·다크드라몬은 군사·공장 맵의 계통 후보다. 앞 두 모델의 모션은 미검증이며 뒤 두 모델의 원작 네 모션 메타데이터는 확인했다.
- 베르스타몬·매그너키드몬·어벤지키드몬·건드라몬은 서로 다른 총격 기술과 다탄 공격을 구현하기 좋다.
- 패럴렐몬은 차원의 통로, 크로노몬 HM/DM은 시간·기록, 좀비플루토몬은 부활·오염, 안바르몬·스컬벌키몬은 탑승·소환 보스 연출과 연결해 검토할 수 있다.

## 계통별 전체 후보


### 유아기·유년기 — 14개

| 후보 | 확인 수준 | 과거 제외 | 출처 |
|---|---|---|---|
| 버드몬 (Budmon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 푸치메라몬 (DemiMeramon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 기기몬 (Gigimon) | 모델 목록만 확인 | — | [Digimon ReArise](https://models.spriters-resource.com/mobile/digimonrearise/) |
| 구미몬 (Gummymon) | 모델 목록만 확인 | — | [Digimon ReArise](https://models.spriters-resource.com/mobile/digimonrearise/) |
| 쟈리몬 (Jyarimon) | 모델 목록만 확인 | — | [Digimon ReArise](https://models.spriters-resource.com/mobile/digimonrearise/) |
| 카프리몬 (Kapurimon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=kapurimon) |
| 코코몬 (Kokomon) | 모델 목록만 확인 | — | [Digimon ReArise](https://models.spriters-resource.com/mobile/digimonrearise/) |
| 뽈뽈몬 (MetalKoromon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=choromon) |
| 모크몬 (Mokumon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 피치몬 (Pichimon) | 모델 목록만 확인 | — | [Digimon ReArise](https://models.spriters-resource.com/mobile/digimonrearise/) |
| 우파몬 (Upamon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 야몬 (Yaamon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 유라몬 (Yuramon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 제리몬 (Zerimon) | 모델 목록만 확인 | — | [Digimon ReArise](https://models.spriters-resource.com/mobile/digimonrearise/) |

### 시작 파트너·성장기 — 20개

| 후보 | 확인 수준 | 과거 제외 | 출처 |
|---|---|---|---|
| 보코몬 (Bokomon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 캔들몬 (Candlemon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 코만드라몬 (Commandramon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 코로나몬 (Coronamon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=coronamon) |
| 도쿠네몬 (Dokunemon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| Flamemon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 플로라몬 (Floramon) | 원작 네 모션 메타데이터 | 재검토 | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=floramon) |
| 감마몬 (Gammamon) | 모델 목록만 확인 | 재검토 | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 기자몬 (Gizamon) | 원작 네 모션 메타데이터 | 재검토 | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=gizamon) |
| 효코몬 (Hyokomon) | 원작 네 모션 메타데이터 | 재검토 | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=hyokomon) |
| 코쿠와몬 (Kokuwamon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=kokuwamon) |
| 코테몬 (Kotemon) | 원작 네 모션 메타데이터 | 재검토 | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=kotemon) |
| 쿠네몬 (Kunemon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 래브라몬 (Labramon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| Neemon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 펭귄몬 (Penguinmon) | 원작 네 모션 메타데이터 | 재검토 | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=penmon) |
| 파스코몬 (Phascomon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 사이케몬 (Psychemon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 스윔몬 (Swimmon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 팅커몬 (Tinkermon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |

### 아머 진화 — 15개

| 후보 | 확인 수준 | 과거 제외 | 출처 |
|---|---|---|---|
| 알로몬 (Allomon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 디그몬 (Digmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=digmon) |
| 플라몬 (Flybeemon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| Gargoylemon | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 고트몬 (Goatmon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 호루스몬 (Halsemon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=halsemon) |
| 하피몬 (Harpymon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 네페르티몬 (Nefertimon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=nefertimon) |
| 페가수스몬 (Pegasusmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=pegasusmon) |
| 판초몬 (Ponchomon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 수리몬 (Shurimon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=shurimon) |
| 잠수몬 (Submarimon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=submarimon) |
| Toucanmon | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 티로몬 (Tylomon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| Yasyamon | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |

### 하이브리드 진화 — 20개

| 후보 | 확인 수준 | 과거 제외 | 출처 |
|---|---|---|---|
| 아루다몬 (Aldamon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=aldamon) |
| 알볼몬 (Arbormon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 블리츠몬 (Beetlemon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 베오울프몬 (BeoWolfmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=beowolfmon) |
| 칼마라몬 (Calmaramon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=calmaramon) |
| 기가스몬 (Gigasmon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| Grumblemon | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| JagerLoweemon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 제트실피드몬 (JetSilphymon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| Kazemon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 블리자몬 (Korikakumon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 챠크몬 (Kumamon) | 모델 목록만 확인 | — | [Digimon Story: Time Stranger](https://models.spriters-resource.com/pc_computer/digimonstorytimestranger/) |
| Loweemon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 메르크리몬 (Mercurymon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| MetalKabuterimon | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 페탈드라몬 (Petaldramon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 라나몬 (Ranamon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=lanamon) |
| Rhihimon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| Sakkakumon | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 슈츠몬 (Zephyrmon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |

### 일리아스·올림포스 — 14개

| 후보 | 확인 수준 | 과거 제외 | 출처 |
|---|---|---|---|
| 아이기오투스몬 (Aegiochusmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=aegiochusmon) |
| 아이기오투스몬[블루] (Aegiochusmon: Blue) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=aegiochusmon-blue) |
| 아이기오투스몬[다크] (Aegiochusmon: Dark) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=aegiochusmon-dark) |
| 아이기오투스몬[그린] (Aegiochusmon: Green) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=aegiochusmon-green) |
| 아이기오투스몬[홀리] (Aegiochusmon: Holy) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=aegiochusmon-holy) |
| 아이기오몬 (Aegiomon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=aegiomon) |
| 아폴로몬 (Apollomon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=apollomon) |
| 바커스몬 (Bacchusmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=bacchusmon) |
| 바커스몬[만취 모드] (Bacchusmon Deisui Mode) | 원작 네 모션 메타데이터 | 재검토 | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=bacchusmon-dm) |
| 케레스몬[미디엄] (Ceresmon Medium) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=ceresmon-medium) |
| 파이라몬 (Firamon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=firamon) |
| 플레어몬 (Flaremon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=flaremon) |
| 그레이스노바몬 (GraceNovamon) | 원작 네 모션 메타데이터 | 재검토 | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=gracenovamon) |
| 유피테르몬[래스 모드] (Jupitermon Wrath Mode) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=jupitermon-wm) |

### 총격·검술·성역 — 11개

| 후보 | 확인 수준 | 과거 제외 | 출처 |
|---|---|---|---|
| 어벤지키드몬 (AvengeKidmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=avengekidmon) |
| 베르스타몬 (BelleStarmon) | 원작 네 모션 메타데이터 | 재검토 | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=beelstarmon) |
| 부라이몬 (Buraimon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=buraimon) |
| 부텐몬 (Butenmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=butenmon) |
| 클라비스엔젤몬 (ClavisAngemon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=clavisangemon) |
| 건드라몬 (Gundramon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=gundramon) |
| 매그너키드몬 (MagnaKidmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=magnakidmon) |
| 메디벌듀크몬 (MedievalGallantmon) | 원작 네 모션 메타데이터 | 재검토 | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=medievalgallantmon) |
| 미스티몬 (Mistymon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=mistymon) |
| 슬래쉬엔젤몬 (SlashAngemon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=slashangemon) |
| 황금무사몬 (Zanbamon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=zanbamon) |

### 숲·곤충·조류 — 15개

| 후보 | 확인 수준 | 과거 제외 | 출처 |
|---|---|---|---|
| 에이션트트로이몬 (AncientTroiamon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 브롯사몬 (Blossomon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| Deramon | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=deramon) |
| 스파이더몬 (Dokugumon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=dokugumon) |
| 크로스몬 (Eaglemon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=eaglemon) |
| 플라이몬 (Flymon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=flymon) |
| 그랑디스쿠가몬 (GrandisKuwagamon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| Jagamon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 주엘비몬 (JewelBeemon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=jewelbeemon) |
| 키위몬 (Kiwimon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=kiwimon) |
| Kokatorimon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 패롯몬 (Parrotmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=parrotmon) |
| RedVegiemon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 스나이몬 (Snimon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=snimon) |
| 요우코몬 (Youkomon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |

### 바다·수중 — 16개

| 후보 | 확인 수준 | 과거 제외 | 출처 |
|---|---|---|---|
| 에이션트머메이몬 (AncientMermaidmon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 브라키몬 (Brachiomon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=brachiomon) |
| 크랩몬 (Crabmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=crabmon) |
| Divermon | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=divermon) |
| 가재드라몬 (Ebidramon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 연체몬 (Gesomon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 점보가메몬 (JumboGamemon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=jumbogamemon) |
| MarineDevimon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 옥토몬 (Octomon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=octomon) |
| 푸쿠몬 (Pukumon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=pukumon) |
| 스콜피오몬 (Scorpiomon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=scorpiomon) |
| 샤크몬 (Sharkmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=sharkmon) |
| 쉘몬 (Shellmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=shellmon) |
| 세이렌몬 (Sirenmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=sirenmon) |
| 얼티메이트브라키몬 (UltimateBrachiomon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=ultimatebrachiomon) |
| 시취에몬 (Xiquemon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |

### 설원·야수·암흑 — 29개

| 후보 | 확인 수준 | 과거 제외 | 출처 |
|---|---|---|---|
| Arukenimon | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=arukenimon) |
| 아스타몬 (Astamon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=astamon) |
| 칼리스몬 (Callismon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=callismon) |
| 케르베로스몬 (Cerberumon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=cerberusmon) |
| 케르베로스몬[인랑] (Cerberumon Werewolf Mode) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=cerberusmon-wm) |
| 다크레오몬 (DarkLeomon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| DarkLizardmon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 델타몬 (Deltamon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=deltamon) |
| 데블드라몬 (Devidramon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 도베르몬 (Dobermon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=dobermon) |
| Doggymon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 푸가몬 (Fugamon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=fugamon) |
| 그레이트그리즈몬 (GreatGrizzlymon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=greatgrizzlymon) |
| 얼음우가몬 (Hyogamon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=hyogamon) |
| 미케몬 (Mikemon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 미노타몬 (Minotarumon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=minotarumon) |
| 모털몬 (Mojyamon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=mojyamon) |
| 미이라몬 (Mummymon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=mummymon) |
| 무사몬 (Musyamon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=musyamon) |
| 네오데블몬 (NeoDevimon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| Persiamon | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| Roachmon | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 블랙버드라몬 (Saberdramon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 원시고부리몬 (Sharmamon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=shamamon) |
| 스노우아구몬 (SnowAgumon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 스노우고부리몬 (SnowGoburimon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=snowgoblimon) |
| 소울몬 (Soulmon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 웬디몬 (Wendigomon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=wendigomon) |
| 위치몬 (Witchmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=witchmon) |

### 공장·병기 — 18개

| 후보 | 확인 수준 | 과거 제외 | 출처 |
|---|---|---|---|
| 반쵸콩알몬 (BanchoMamemon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=banchomamemon) |
| 빅콩알몬 (BigMamemon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=bigmamemon) |
| 브링프몬 (Blimpmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=blimpmon) |
| 브리웨루드라몬 (BryweLudramon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 다크드라몬 (Darkdramon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=darkdramon) |
| 다크슈퍼스타몬 (DarkSuperStarmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=darksuperstarmon) |
| 째리몬 (Giromon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| Gizumon AT | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| Gizumon XT | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 로코몬 (Locomon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=locomon) |
| 마스터브링프몬 (MasterBlimpmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=masterblimpmon) |
| 메카노리몬 (Mechanorimon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=mekanorimon) |
| 라이지루도몬 (RaijiLudomon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 실즈드라몬 (Sealsdramon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 탱크드라몬 (Tankdramon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=tankdramon) |
| Thundermon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 티아루도몬 (TiaLudomon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 트루프몬 (Troopmon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |

### 희귀 보스·특수 진화 — 27개

| 후보 | 확인 수준 | 과거 제외 | 출처 |
|---|---|---|---|
| 에이션트스핑크스몬 (AncientSphinxmon) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 에이션트와이즈몬 (AncientWisemon) | 원작 네 모션 메타데이터 | 재검토 | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=ancientwisemon) |
| Boltboutamon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 카오스피에몬 (ChaosPiedmon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 크로노몬: 디스트로이 모드 (Chronomon Destroy Mode) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=chronomon-dm) |
| 크로노몬: 홀리 모드 (Chronomon Holy Mode) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=chronomon-hm) |
| 마왕몬 (Daemon (Mantled)) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 디지앙몬 (DiJiangmon) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 다이노렉스몬 (Dinorexmon) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 엘도라디몬 (Eldoradimon) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 안바르몬 (Enbarrmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=enbarrmon) |
| 손오공몬 (Gokuwmon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 황제드라몬 (Imperialdramon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=imperialdramon-dm) |
| 리엔푸몬 (Lianpumon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 루체몬[라르바] (Lucemon Larva) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 무르무크스몬 (Murmukusmon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| NeoMyotismon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 오르디네몬 (Ordinemon) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 패럴렐몬 (Parallelmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=parallelmon) |
| 패러사이몬 (Parasimon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 삼장몬 (Sanzomon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| ShadowSeraphimon | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 샤카몬 (Shakamon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 스컬벌키몬 (SkullBaluchimon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=skullbaluchimon) |
| 빅토리그레이몬 (VictoryGreymon) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 싱티안몬 (Xingtianmon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 좀비플루토몬 (ZombiePlutomon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=zombieplutomon) |

### X항체·체스·기타 분기 — 21개

| 후보 | 확인 수준 | 과거 제외 | 출처 |
|---|---|---|---|
| 안티라몬(데바) (Antylamon (Deva)) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 케루비몬(악)[X항체] (Cherubimon (Evil) X) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 로드나이트몬(X항체) (Crusadermon X) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 데크스도루가몬 (DexDorugamon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| DexDorugoramon | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| DexDorugreymon | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 헤라클레스캅테리몬(X항체) (HerculesKabuterimon X) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 저스티몬(X항체) (Justimon X) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 나이트체스몬(흑) (KnightChessmon (Black)) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 나이트체스몬(백) (KnightChessmon (White)) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 미네르바몬(X항체) (Minervamon X) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| Omedamon | 모델 목록만 확인 | — | [Digimon ReArise](https://models.spriters-resource.com/mobile/digimonrearise/) |
| 폰체스몬(흑) (PawnChessmon (Black)) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 폰체스몬(백) (PawnChessmon (White)) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 뇌신몬 (Raijinmon) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 샤크라몬[무녀 모드] (Sakuyamon Miko Mode) | 모델 목록만 확인 | 재검토 | [Digimon ReArise](https://models.spriters-resource.com/mobile/digimonrearise/) |
| 샤우트몬[스타소드] (Shoutmon + Starsword) | 모델 목록만 확인 | — | [Digimon Fusion Fighters](https://models.spriters-resource.com/mobile/digimonfusionfighters/) |
| 시스터몬 시엘 (Sistermon Ciel) | 모델 목록만 확인 | — | [Digimon Story Cyber Sleuth: Complete Edition](https://models.spriters-resource.com/pc_computer/digimonstorycybersleuthcompleteedition/) |
| 시스터몬 시엘[각성] (Sistermon Ciel (Awakened)) | 모델 목록만 확인 | — | [Digimon Story Cyber Sleuth: Complete Edition](https://models.spriters-resource.com/pc_computer/digimonstorycybersleuthcompleteedition/) |
| 탁탑몬: 래스 모드 (Takutoumon Wrath Mode) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 알포스브이드라몬[퓨처 모드] (UlforceVeedramon Future Mode) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |

### 추가 조사 후보 — 35개

| 후보 | 확인 수준 | 과거 제외 | 출처 |
|---|---|---|---|
| 아누비스몬 (Anubismon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 에이프몬 (Apemon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 아수라몬 (Asuramon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 할매몬 (Babamon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 블랙그라우몬 (BlackGrowlmon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 블랙세인트가르고몬 (BlackMegaGargomon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 폭탄모야몬 (BomberNanimon) | 모델 목록만 확인 | — | [Digimon ReArise](https://models.spriters-resource.com/mobile/digimonrearise/) |
| 동글몬 (Calumon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| Centarumon | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=centarumon) |
| 초핫카이몬 (ChoHakkaimon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 투명아구몬 (ClearAgumon) | 모델 목록만 확인 | — | [Digimon World 2](https://models.spriters-resource.com/playstation/digimonworld2/) |
| 리볼몬 (Deputymon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=deputymon) |
| 도우몬 (Doumon) | 모델 목록만 확인 | — | [Digimon ReArise](https://models.spriters-resource.com/mobile/digimonrearise/) |
| 두리몬 (Drimogemon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=drimogemon) |
| 에렉몬(보라) (Elecmon (Violet)) | 모델 목록만 확인 | — | [Digimon ReArise](https://models.spriters-resource.com/mobile/digimonrearise/) |
| ExTyrannomon | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=extyrannomon) |
| 가비지몬 (Garbagemon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=garbagemon) |
| 그라디몬 (Gladimon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| Gorillamon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 가와파몬 (Gwappamon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=gawappamon) |
| 조커몬 (Jokermon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 코스파이더몬 (Kodokugumon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 램프몬 (Lampmon) | 모델 목록만 확인 | 재검토 | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 매드레오몬[파이널] (MadLeomon (Final Mode)) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 메르바몬 (Mervamon) | 원작 네 모션 메타데이터 | 재검토 | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=mervamon) |
| 오니스몬 (Ornismon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 픽크몬 (Pickmon) | 모델 목록만 확인 | — | [Digimon Masters](https://models.spriters-resource.com/pc_computer/digimonmasters/) |
| 포큐파몬 (Porcupamon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| Reapmon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 사우자몬 (Shawjamon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=shaujinmon) |
| 스컬맘몬 (SkullMammothmon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=skullmammothmon) |
| 스컬시드라몬 (SkullSeadramon) | 원작 네 모션 메타데이터 | — | [Digimon Story: Time Stranger](https://nuffle.me/dsts-viewer?m=skullseadramon) |
| Vilemon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| Volcdramon | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |
| 배드퍼펫몬 (WaruMonzaemon) | 모델 목록만 확인 | — | [Digimon New Century](https://models.spriters-resource.com/mobile/digimonnewcentury/) |

## 과거 제외종의 재검토

다음 11개는 기존 임의 제작 공격 대신 타임 스트레인저 원작 공격 자료를 확보할 수 있는 새 경로를 확인했다. 다시 넣기 전 변환·자세·지면·공격 타이밍 검증이 필요하다.

- [에이션트와이즈몬 (AncientWisemon)](https://nuffle.me/dsts-viewer?m=ancientwisemon)
- [바커스몬[만취 모드] (Bacchusmon Deisui Mode)](https://nuffle.me/dsts-viewer?m=bacchusmon-dm)
- [베르스타몬 (BelleStarmon)](https://nuffle.me/dsts-viewer?m=beelstarmon)
- [플로라몬 (Floramon)](https://nuffle.me/dsts-viewer?m=floramon)
- [기자몬 (Gizamon)](https://nuffle.me/dsts-viewer?m=gizamon)
- [그레이스노바몬 (GraceNovamon)](https://nuffle.me/dsts-viewer?m=gracenovamon)
- [효코몬 (Hyokomon)](https://nuffle.me/dsts-viewer?m=hyokomon)
- [코테몬 (Kotemon)](https://nuffle.me/dsts-viewer?m=kotemon)
- [메디벌듀크몬 (MedievalGallantmon)](https://nuffle.me/dsts-viewer?m=medievalgallantmon)
- [메르바몬 (Mervamon)](https://nuffle.me/dsts-viewer?m=mervamon)
- [펭귄몬 (Penguinmon)](https://nuffle.me/dsts-viewer?m=penmon)

오르디네몬, 감마몬, 빅토리그레이몬, 체스몬 4종 등 나머지 과거 제외 후보 20개는 새 필수 모션 세트를 확인하지 못했다. 현재 목록에 그대로 복원할 수 있다고 판단하지 않았다.

## 별도 장기 조사 대상 — 위 255개에 미포함

- **샤우트몬 X7**: 원작 Masters에 등장한 사실은 공식 업데이트로 확인했다. 바로 가져올 수 있는 공개 원본 모션 패키지는 이번에 확인하지 못했다. [공식 Masters 업데이트](https://store.steampowered.com/news/posts/?enddate=1658826083&feed=steam_community_announcements)
- **블룸로드몬**: 기존 공격 모션 문제로 제외된 종이며, 이번 공개 목록에서는 새 원본 공격 패키지를 확인하지 못했다.
- **시리우스몬·아크투루스몬·프록시마몬, 루가몬 계통, 프테로몬·슈몬 계통**: 추가 가치가 큰 장기 후보지만 이번 조사에서 게임에 쓸 수 있는 필수 모션 패키지를 확인하지 못해 확인된 후보 수에 넣지 않았다.

## 주요 조사 출처

- [Time Stranger public viewer](https://nuffle.me/dsts-viewer/) — 476개 공개 도감 항목 대조. 신규 후보 108개 GLB의 JSON 청크만 HTTP Range로 확인; 모델 BIN·텍스처 파일 일괄 다운로드 안 함.
- [Time Stranger extractor](https://tangled.org/nuffle.me/dsts-extractor) — 제작자 문서상 본인 보유 게임에서 추출하는 경로. 추출기를 실행하거나 게임 소유 여부를 확인하지 않았음.
- [Time Stranger viewer source](https://tangled.org/nuffle.me/dsts-viewer) — 모델은 저장소에 배포하지 않는다고 안내. 공개 뷰어와 소스 프로젝트를 재배포 허가로 해석하지 않음.
- [공개 모델 목록](https://models.spriters-resource.com/pc_computer/digimonstorytimestranger/)
- [공개 모델 목록](https://models.spriters-resource.com/mobile/digimonnewcentury/)
- [공개 모델 목록](https://models.spriters-resource.com/mobile/digimonrearise/)
- [공개 모델 목록](https://models.spriters-resource.com/mobile/digimonlinks/)
- [공개 모델 목록](https://models.spriters-resource.com/pc_computer/digimonmasters/)
- [공개 모델 목록](https://models.spriters-resource.com/mobile/digimonfusionfighters/)
- [공개 모델 목록](https://models.spriters-resource.com/pc_computer/digimonstorycybersleuthcompleteedition/)
- [공개 모델 목록](https://models.spriters-resource.com/playstation/digimonworld2/)
- [디지몬 공식 한국어 도감](https://digimon.net/reference_ko/)

## 검증 기록

- 후보 255개 영문 키 중복 없음; 모든 후보에 HTTPS 출처가 있음.
- 원작 모션 메타데이터 108개: idle / attack / damage / down 채널 모두 존재. 전용 death는 별도 필드.
- 현재 모델 512개와 별칭·모드 대조를 거쳐 기존 수록종을 제외했다.
- 공식 도감이 없는 주소의 검색 페이지를 유효한 프로필로 처리하지 않았다. 미확인 명칭·세대는 확인된 정보처럼 표시하지 않았다.
- 게임 코드·게임 데이터의 수정, 원작 추출기 실행, 전 후보 시각 QA와 배포는 이번 연구 범위에 포함하지 않았다.
