# 웹 로그인과 배포

공개 주소: [디지로그 웹 버전](https://digirouge.co.kr)

## 로그인과 진행 기록

웹 첫 화면에서 Google 로그인 또는 게스트로 시작한 뒤 메인 메뉴로 이동한다. Firebase Authentication의 Google 인증과 브라우저 로컬 게스트를 사용하며 로그인 상태는 브라우저를 다시 열어도 유지한다. 로그인 방식을 선택하기 전에는 큰 게임·3D 번들을 불러오지 않는다.

진행 기록은 현재 브라우저의 로컬 저장 공간에 보관한다. Google 계정은 Firebase UID별 공간을 사용하며, 게스트는 해당 도메인의 로컬 기록을 사용한다. 로그아웃해도 저장 기록은 지우지 않는다. 다른 브라우저·기기·도메인으로 자동 동기화하는 클라우드 저장은 구현하지 않았다.

게스트가 메인 메뉴에서 Google 계정으로 연결하면, 이 브라우저에 기록이 없는 새 계정에 한해 도감·스캔·스킬·마을·신뢰도·모드·자동 저장·선택 저장·설정을 복사한다. 기존 계정 기록을 덮어쓰거나 합치지 않는다. 저장 공간 오류가 나면 복사한 항목만 되돌리고 게스트 원본을 보존한다.

도메인을 변경해도 이전 도메인의 브라우저 저장 데이터를 삭제하지는 않는다. 브라우저 저장소는 출처별로 분리되므로 이전 주소의 기록이 새 주소로 자동 이전되지는 않는다. 이번 변경은 호스팅과 주소 연결을 변경했으며 사용자 저장 데이터를 삭제하지 않았다.

게스트는 Firebase에 익명 계정을 만들지 않고 로컬 기록으로 바로 진입한다. 이전 익명 로그인 세션은 로컬에서 로그아웃하되 게스트 저장 데이터는 유지한다. 페이지 자체의 오프라인 설치·캐시는 포함하지 않는다. AURORA Launcher의 로그인 없는 로컬 게스트·IPC 파일 저장과 설치 패키지는 이번 작업에서 변경하지 않았다.

## 운영 리소스

| 항목 | 값 |
| --- | --- |
| 공식 게임 주소 | https://digirouge.co.kr |
| DNS 관리 | 가비아 |
| A 레코드 (@) | 216.150.1.1, 216.150.16.1 |
| Firebase 프로젝트 | digirogue-510313 |
| Firebase 인증 도메인 | digirogue-510313.firebaseapp.com |
| Vercel 프로젝트 | digilog-web-preview |
| Vercel 프로젝트 ID | prj_D39FMNYtKjtyZ8nYrmKS98nn5F2R |
| Vercel 팀 ID | team_0pXPkw9uj74xSFTG03R2YRpb |
| 운영 소스 브랜치 | main |
| 에셋 CDN | https://digirouge.co.kr (Vercel static) |
| 에셋 버전 | 파일 내용 SHA-256 쿼리 v |
| 압축 모델 | 512개, 원본과 Brotli 압축 해제 바이트 동일 |

Vercel이 앱과 public 리소스를 직접 제공한다. Firebase로 전달하던 외부 rewrite는 제거했다. 모델은 별도 .glb.br 파일과 Content-Encoding: br로 제공하고, 모델·BGM의 내용 해시가 바뀔 때 다운로드 URL도 바뀐다. 버전 쿼리가 있는 모델·BGM만 1년 immutable 캐시를 사용하며 버전 없는 리소스는 1일 캐시를 사용한다. 자세한 운영 기준은 docs/NETWORK_BUDGET.md를 따른다.

새 Vercel 배포의 모델·BGM·한글 경로를 실제 바이트로 확인한 뒤 Firebase Hosting의 live 정적 파일 제공을 종료하고 이전 파일 주소를 Vercel로 이동시킨다. Firebase Authentication과 /__/auth/* 예약 경로는 유지하며 계정과 저장 데이터를 삭제하지 않는다. 이전 Hosting 버전은 복구용으로 남긴다.

Firebase 인증의 허용 도메인은 공식 게임 주소, Firebase 인증·영구 에셋 주소, localhost 및 127.0.0.1이다. 삭제한 임시 게임 주소는 로그인 허용 목록에서도 제거했다.

## 제거한 임시 주소

- digirouge.vercel.app
- digilog-web-preview.vercel.app
- digilog-web-preview-dongsusins-projects.vercel.app
- digirogue-510313--digilog-web-preview-w0kilmt5.web.app

앞의 Vercel 주소들은 프로젝트 도메인·별칭에서 제거했고 Firebase 미리보기 채널은 삭제했다. 공식 도메인에 영향을 주는 전체 사이트·프로젝트 삭제는 하지 않았다. Vercel의 개별 배포 주소는 기존 인증 보호 설정(all_except_custom_domains)을 유지한다. 후속 배포 후에도 공개 프로젝트 도메인은 digirouge.co.kr 하나만 유지하고 불필요한 자동 별칭이 생겼는지 확인한다.

## 재빌드와 재배포

프로젝트 루트에서 실행한다.

~~~powershell
npm ci
npm run test:auth
npm run test:guest-budget
npm run test:network-budget
npm run test:hosting-budget
npm run build
npm run verify -- --dist
~~~

public 리소스 경로가 달라지면 정적 호스팅 설정을 다시 생성하고 내용을 확인한다.

~~~powershell
node scripts/prepare-vercel-preview.mjs
~~~

스크립트의 기존 파일명은 유지하지만 Firebase 주소 인수는 받지 않는다. Vercel CLI에 권한 있는 계정으로 로그인한 상태에서 같은 팀·프로젝트에 게시한다.

~~~powershell
npx vercel --scope team_0pXPkw9uj74xSFTG03R2YRpb link --project digilog-web-preview --yes
npx vercel --scope team_0pXPkw9uj74xSFTG03R2YRpb deploy --prod --yes
~~~

Firebase 웹앱의 공개 설정은 src/auth/firebaseConfig.json에 있다. 서비스 계정 키·CLI 인증 토큰·.env 파일을 배포하지 않는다. .vercelignore는 dist·node_modules·.git·.tmp-web-deploy·docs·.env*·.vercel을 제외하며 public은 반드시 업로드에 포함한다. Brotli 파일은 빌드 단계에서 만들므로 소스 업로드를 중복하지 않는다.

## 2026-10-09 주소 이전 검증

- 가비아의 A 레코드 2개를 설정하고 Vercel에서 misconfigured=false를 확인했다.
- 새 주소 HTTPS GET 200 및 새 READY 배포를 확인했다. Vercel 빌드·배포는 종료 코드 0이다.
- 이전 Firebase 버전에서 게임 에셋 1,761개를 복제했고 전체 경로·파일 해시가 일치했다. 모델·맵·BGM·로고 등 대표 파일 6개는 새 주소에서 GET 200 및 로컬 원본 SHA-256 일치를 확인했다.
- 인증·저장 회귀 검사 7개를 통과했다.
- 새 주소의 Google 인증창이 accounts.google.com으로 연결됨을 확인했다. 실제 개인 계정의 로그인 완료는 검증하지 않았다.
- 새 주소에서 게스트 메인 진입·시작 디지몬 3D 미리보기·실제 전투의 모델 2개 로딩을 확인했다.
- 자동 저장 표시와 선택 저장 생성, 새로고침 후 로그인 유지, 선택 저장 이어하기 및 전투 모델 복구를 실제 UI에서 확인했다. 브라우저 실행 오류는 0개였다.
- 삭제한 임시 주소 4개가 HTTP 404로 응답하고 새 주소의 캐시 없는 모델 요청이 HTTP 200으로 응답함을 확인했다.

검증 결과와 스크린샷은 ../artifacts/digirouge-custom-domain-2026-10-09/에 보관한다. 물리 모바일·Safari·기기 및 이전 도메인 간 저장 동기화는 검증 범위에 포함하지 않는다.

## 2026-10-09 메인 메뉴 선택 표시 배포

- 메인 메뉴의 화살표가 마우스 호버·키보드 포커스를 따라 이동하며 금색 배경·테두리로 현재 항목을 표시한다.
- 배포한 메뉴 변경 파일은 src/App.jsx와 src/App.css다.
- Vercel 운영 빌드·배포 종료 코드 0, READY 및 공식 주소 HTTP 200을 확인했다.
- 공식 주소의 실제 게스트 로그인·메뉴 선택·자동/선택 저장·새로고침·이어하기 등 브라우저 38개 확인 항목을 통과했다.
- 인증 회귀 7개와 실행 파일 검사 --dist를 통과했으며 대표 에셋 6개의 원본 SHA-256이 일치했다.
- 자동 생성된 임시 별칭을 삭제하고 공개 프로젝트 도메인과 별칭을 digirouge.co.kr 하나로 유지했다.
- 검증 자료: ../artifacts/digirouge-menu-deploy-2026-10-09/. 개인 Google 계정 로그인 완료·물리 모바일·Safari는 이번 확인 범위에 포함하지 않는다.

## 2026-10-09 시작 디지몬 미리보기 크기 수정

- 발견 상태와 사용 가능 상태의 미리보기를 두 번째 참고 화면에 맞춘 204px(게임 기준 좌표) 높이로 고정했다. 정보가 적어도 남는 공간만큼 확대되지 않는다.
- 긴 능력치·기술 정보만 내부에서 스크롤하며 미리보기와 팀 추가 버튼은 고정한다. 발견 상태의 이미지·스캔율 및 미발견 숨김은 유지한다.
- 변경 파일: src/components/StarterSelection.jsx, src/components/StarterSelection.css.
- 대표 6종과 1600×900, 1366×768, 960×540, 812×375 화면에서 로컬 198개·운영 웹 202개 확인 항목을 통과했다. 운영 검사는 실제 Firebase 게스트 로그인 후 별도 테스트 브라우저 저장소로 진행했고 실행·콘솔·에셋 요청 오류는 0개였다.
- 로컬 빌드·실행 파일 검사 --dist·Vercel 운영 배포는 종료 코드 0이며 공식 주소 HTTP 200 및 READY를 확인했다. 자동 생성된 임시 별칭은 다시 제거했다.
- 검증 자료: ../artifacts/digirouge-starter-preview-2026-10-09/. 물리 모바일·Safari와 모든 모델의 개별 시각 검수는 이번 범위에 포함하지 않는다.

## 2026-10-09 보유 디지몬 한도와 알 표시

- 알을 포함해 보유 한도를 8마리로 통일했다. 디지에그 보상·스캔 부화가 가득 찬 파티에 바로 추가되는 대신 보유 멤버를 선택해 교체하거나 영입을 취소한다. 지역 지원 동료는 보유 슬롯에서 제외한다.
- 교체 확정 전에는 스캔율·해금·골드·스테이지 진행을 소비하지 않는다. 마지막 전투 가능 디지몬은 알로 교체할 수 없다. 기존 초과 저장의 멤버는 정리 대기 목록으로 보존하고 사용자가 각각 결정한다.
- 진화·전투 교체·전투 불능 교체·아이템 대상·영입 교체·저장 슬롯에 알과 부화 대기를 표시한다. 알이 할 수 없는 행동은 선택을 막고 긴 목록에는 내부 스크롤을 적용한다.
- 게임 수정 커밋: a843a2db4136743c5d1ab8f3c65f09b768e07f8e. 전체 회귀 238개, 로컬 브라우저 62개, 실제 Firebase 게스트로 운영 웹 25개 확인 항목을 통과했다. 브라우저 실행·콘솔·에셋 요청 오류는 0개였다.
- 운영 웹에서 교체 취소·확정, 스캔율 100% 보존과 확정 후 소모, 선택 저장·새로고침·이어하기, 새 파티로 다음 스테이지 진입을 확인했다. 로컬에서는 기존 12마리 저장의 명시적 정리와 초과 멤버 보존도 검증했다.
- 로컬 빌드·실행 파일 검사 --dist·Vercel 배포는 종료 코드 0이며 공식 주소 HTTP 200과 READY를 확인했다. 자동 생성된 프로젝트·main 브랜치 임시 별칭은 제거했다.
- 검증 자료: ../artifacts/digirouge-party-capacity-2026-10-09/. 물리 모바일·Safari와 런처 설치 패키지 재생성은 이번 검증 범위에 포함하지 않는다.

공식 참고: [Firebase Google 인증](https://firebase.google.com/docs/auth/web/google-signin), [Firebase Hosting 채널 관리](https://firebase.google.com/docs/hosting/manage-hosting-resources), [Vercel 도메인 연결](https://vercel.com/docs/domains/working-with-domains/add-a-domain).