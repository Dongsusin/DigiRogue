# GitHub 저장소 관리

공식 소스 저장소는 [Dongsusin/DigiRogue](https://github.com/Dongsusin/DigiRogue)이며 기본 브랜치는 `main`입니다. 기존 커밋 이력을 이어서 사용합니다.

## 처음 내려받아 실행하기

Git, Git LFS, Node.js 24 이상을 준비한 뒤 실행합니다. 모델과 음원은 Git LFS로 관리하므로 ZIP 소스 다운로드 대신 Git으로 복제하세요.

```powershell
git lfs install
git clone https://github.com/Dongsusin/DigiRogue.git
cd DigiRogue
git config core.quotepath false
git lfs pull
npm ci
npm run dev
```

`core.quotepath=false`는 한글 파일명이 따옴표와 숫자 이스케이프로 표시되면서 Windows의 Git LFS 상태 조회가 실패하는 문제를 방지합니다. 로그인·배포 인증 정보는 개인 환경에서 준비하고 저장소에 넣지 않습니다. Firebase 웹앱의 공개 설정은 `src/auth/firebaseConfig.json`에 있으며 서비스 계정 비밀 키가 아닙니다.

## 관리 대상

- `src`, `data`, `scripts`, `docs`, 패키지 잠금 파일과 설정 파일을 함께 커밋합니다.
- 게임에 필요한 `public`의 모델·음원·맵·아이템·폰트·미리보기와 에셋 출처 기록을 포함합니다. `.gitattributes`가 GLB 모델과 BGM의 LFS 포인터를 자동으로 만듭니다.
- `node_modules`, `dist`, `.env*`, `.vercel`, 변환 캐시, 검증 결과, 설치 패키지와 플레이 저장 파일은 `.gitignore`로 제외합니다. `.env.example`에는 실제 비밀 값 없이 설정 예시만 둡니다.
- 완성된 게임 파일은 `npm run build`로 다시 생성합니다. 운영 웹·런처 반영은 [배포 문서](WEB_AUTH_DEPLOYMENT.md)와 [README](../README.md)를 따릅니다.

## 변경과 검증

작업 전 `git status`와 `git pull --ff-only`로 상태를 확인합니다. 진행 중인 수정이 있으면 먼저 커밋하며, 기능별 브랜치와 변경 목적이 드러나는 커밋 메시지를 사용합니다. 서로 다른 기능은 가능하면 별도 커밋으로 나눕니다.

```powershell
git switch -c feature/작업이름
# 해당 변경에 필요한 검사 실행
npm run test:auth
npm run test:bosses
npm run build
npm run verify -- --dist
git diff --check
git status --short
git add 수정한파일
git diff --cached --stat
git commit -m "fix(ui): 시작 디지몬 미리보기 크기 고정"
git push -u origin HEAD
```

현재 Vercel의 digilog-web-preview 프로젝트는 이 저장소의 main 브랜치와 연결되어 있으며 main 푸시 후 운영 배포를 자동으로 시작합니다. 푸시 성공과 웹 반영은 별도로 확인하고 READY·공식 도메인 응답·변경된 게임 동작까지 검증합니다. 자동 생성된 임시 프로젝트·브랜치 별칭은 제거하고 공개 주소를 digirouge.co.kr 하나로 유지합니다.

공유 브랜치의 이력을 강제로 덮어쓰지 않습니다. 푸시가 거절되면 원격 변경을 가져와 차이를 확인한 뒤 병합하거나 별도 브랜치로 올립니다. 소스 푸시와 운영 배포는 각각 확인하고, 자동 배포가 연결되어 있지 않다면 GitHub 푸시만으로 웹 반영이 완료됐다고 보지 않습니다.

## 업로드 확인

```powershell
git fetch origin
git rev-parse HEAD
git rev-parse origin/main
git status --short
git lfs fsck --objects --pointers HEAD
```

`main` 업로드 직후에는 두 커밋 ID가 같고 작업 폴더가 깨끗해야 합니다. LFS 오류가 있으면 큰 파일이 정상적으로 내려받아졌는지 먼저 확인하고, 실제 게임 에셋 대신 포인터 파일만 남은 상태로 빌드하지 않습니다.
