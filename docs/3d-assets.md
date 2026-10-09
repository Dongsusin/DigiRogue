# 디지로그 3D 에셋 출처

현재 모델은 512종이며 전투에 필요한 idle, attack, damage, die 동작과 모델에서 렌더링한 썸네일·정면 이미지를 포함한다. 실제 개별 출처 페이지와 동작 정보는 `src/data/digimonModelManifest.json`에 보관한다. 원본 512개 GLB의 바이트는 용량 정리 중 변경하지 않았다.

원본 게임별 모델 수:

- Digimon Links: 253종
- Digimon Story Cyber Sleuth: Complete Edition: 114종
- Digimon ReArise: 78종
- Digimon Fusion Fighters: 23종
- Digital Beast (unofficial game): 6종
- Digimon New Century: 38종

원본 모델 압축파일과 변환·검사 도구는 삭제했다. 다시 원본을 찾는 데 필요한 에셋 ID, 아카이브 주소, 변환 옵션은 `docs/asset-sources/digimon-model-sources.json`과 `digimon-archive-urls.json`에 남겼다. 새 다운로드로 얻은 파일은 현재 사용 중인 모델과 동일한지 별도로 검증해야 한다.

대부분은 [The Models Resource](https://models.spriters-resource.com/)의 게임 모델 추출물이고 일부는 비공식 Digital Beast 출처를 사용한다. 개별 모델은 매니페스트의 source.url을 따른다. 디지몬과 원작 게임 자산의 권리는 Bandai Namco, Toei Animation 및 각 원작 개발사에 있으며 추출 기여자는 해당 출처 페이지를 따른다.

기존 사용 조건: [The Models Resource 이용 약관](https://models.spriters-resource.com/page/tou/)을 확인해야 한다. 다운로드 가능 여부가 원작 저작권자의 배포·상업 이용 허가를 의미하지 않는다. 이 프로젝트의 배포·수익화 권리는 검증하지 않았다.
