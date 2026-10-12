# 디지로그

디지몬 512종의 3D 모델을 사용하는 팬게임입니다. AURORA Launcher 다운로드 버전과 웹 버전으로 플레이할 수 있습니다.

## 웹 플레이

[디지로그 웹 버전 열기](https://digirouge.co.kr)

첫 화면에서 Google 로그인 또는 게스트로 시작합니다. 진행 기록은 현재 브라우저에 계정별로 저장하며 기기 간 자동 동기화는 제공하지 않습니다. 런처의 기존 로컬 저장 방식은 유지합니다.

게임 파일은 만료 없는 영구 호스팅으로 제공됩니다. 운영 주소와 재배포 방법은 [웹 로그인·배포 기록](docs/WEB_AUTH_DEPLOYMENT.md)을 참고하세요.

## 소스 저장소

[GitHub: Dongsusin/DigiRogue](https://github.com/Dongsusin/DigiRogue)에서 소스와 게임 에셋을 관리합니다. 모델·음원 다운로드에 Git LFS가 필요합니다. 복제·검증·커밋 방법은 [저장소 관리 문서](docs/GIT_WORKFLOW.md)를 참고하세요.

## 실행과 저장

최신 설치 파일: `../play-hub/release/current/AURORA-Launcher-1.2.3-x64-setup.exe`

런처에서 디지로그를 설치하고 플레이하세요. 이미 설치한 런처와 플레이 기록은 정리 과정에서 변경하지 않았습니다. 최신 런처에는 음원 최적화와 전투 카드 20종이 적용된 디지로그 패키지가 포함되어 있습니다.

진행 기록은 게임 설치 폴더와 분리된 다음 위치에 저장됩니다.

```text
%APPDATA%/AURORA Launcher/saves/digilog/main.json
%APPDATA%/AURORA Launcher/saves/digilog/main.backup.json
```

자동 저장 1개와 선택 저장 3개는 하나의 로컬 프로필에서 관리합니다. **이어하기**에서 각 슬롯의 휴지통 버튼을 누르고 확인하면 해당 저장만 비울 수 있습니다. 도감·스캔·스킬·마을 기록과 다른 슬롯은 유지됩니다. 저장 파일과 백업을 직접 삭제하지 마세요.

알을 포함한 보유 디지몬은 최대 8마리입니다. 가득 찬 상태에서 영입할 때의 교체·취소와 기존 초과 저장 처리 방식은 [보유 디지몬 관리](docs/PARTY_MANAGEMENT.md)를 참고하세요.

메인 메뉴의 **도감**에서 디지에그별 부화·진화 계통을 확인할 수 있습니다. 미발견 디지몬은 `?`로 표시합니다. 구성과 검증 방법은 [디지몬 도감](docs/DIGIMON_DEX.md)을 참고하세요.

메인 메뉴의 **명예의 전당**에서 캐주얼·하드의 200층 공용 순위와 최종 파티를 확인합니다. 기록 기준과 운영 방식은 [명예의 전당](docs/HALL_OF_FAME.md)을 참고하세요.

## 남겨 둔 파일

- `dist`: 런처가 설치하는 완성된 게임 파일
- `public`: 모델·맵·아이템·폰트·음원의 원본 게임 데이터
- `src`, `data`, Vite 설정과 패키지 잠금 파일: 추후 수정과 재빌드를 위한 최소 소스
- `.git`: 기존 소스 이력과 복구 기록
- `docs/asset-sources`, [3D 에셋 출처](docs/3d-assets.md), [아이템 원화 출처](docs/item-art.md)

이전 런처·설치 파일, 임시 배포본, 변환 캐시, 원본 다운로드 ZIP, 테스트 갤러리, 검증 스크린샷과 개발 의존성은 정리했습니다. BGM은 AI가 새로 작곡·편곡하고 로컬 합성으로 렌더링한 오리지널 10곡만 사용합니다. 기존 디지몬 BGM 파일은 제거했습니다. [음악 제작 정보](docs/ai-soundtrack.md)에서 곡 구성과 재생성 방법을 확인할 수 있습니다.

## 무결성 확인과 재빌드

Node.js가 있으면 개발 의존성을 설치하지 않아도 다음 검사로 모델·필수 모션·썸네일·음원·맵·카드 원화 참조와 배포 파일을 확인할 수 있습니다.

```powershell
node scripts/verify-runtime.mjs --dist
node scripts/verify-battle-items.mjs
```

다시 수정할 때만 빌드 도구를 설치합니다.

```powershell
npm ci
npm run build
npm run verify -- --dist
```

완성된 `dist`를 런처에 반영하려면 `play-hub`에서 실행합니다.

```powershell
npm ci
node scripts/package-games.mjs --skip-build --only digilog
npm run package:installer
```

원작 및 각 에셋의 권리는 해당 권리자에게 있으며 개별 출처는 모델 매니페스트와 출처 기록에 남아 있습니다.
