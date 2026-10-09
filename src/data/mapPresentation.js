// Foreground platform surfaces, measured in the shipped PNGs. The floor ratios
// use source pixels so the front ledge is not confused with scenery behind it.
// Backgrounds use cover + bottom alignment; their aspect ratios must stay intact.
export const MAP_PRESENTATION = {
  '가디언 팰리스': { aspect: 1672 / 941, floor: 851 / 941 },
  '겐시 대륙': { aspect: 1672 / 941, floor: 851 / 941 },
  '기어 포레스트': { aspect: 1672 / 941, floor: 842 / 941 },
  '기어사바나': { aspect: 1671 / 940, floor: 864 / 940 },
  '나이트메어 솔저스': { aspect: 1536 / 1024, floor: 924 / 1024 },
  '네트의 바다': { aspect: 1671 / 940, floor: 840 / 940 },
  '다크 에리어': { aspect: 1672 / 941, floor: 847 / 941 },
  '다크 웹': { aspect: 1672 / 941, floor: 847 / 941 },
  '다크 필드': { aspect: 1672 / 941, floor: 850 / 941 },
  '메탈 엠파이어': { aspect: 1672 / 941, floor: 849 / 941 },
  '무한산': { aspect: 1671 / 940, floor: 842 / 940 },
  '미하라시 산': { aspect: 1671 / 940, floor: 846 / 940 },
  '부트 화산': { aspect: 1672 / 941, floor: 851 / 941 },
  '비틀랜드': { aspect: 1671 / 940, floor: 842 / 940 },
  '사규산': { aspect: 1672 / 941, floor: 846 / 941 },
  '선공계': { aspect: 1672 / 941, floor: 859 / 941 },
  '센트럴 타운': { aspect: 1672 / 941, floor: 850 / 941 },
  '시작의마을': { aspect: 1671 / 940, floor: 867 / 940 },
  '쓰레기의 산': { aspect: 1672 / 941, floor: 852 / 941 },
  '아시노 섬': { aspect: 1672 / 941, floor: 854 / 941 },
  '아이스 생츄어리': { aspect: 1672 / 941, floor: 849 / 941 },
  '어비스 에리어': { aspect: 1672 / 940, floor: 846 / 940 },
  '어셈블러 타워': { aspect: 1671 / 940, floor: 856 / 940 },
  '오버델 묘지': { aspect: 1672 / 941, floor: 856 / 941 },
  '용의눈호수': { aspect: 1672 / 941, floor: 874 / 941 },
  '용정궁': { aspect: 1672 / 941, floor: 872 / 941 },
  '윈드 가디언즈': { aspect: 1672 / 941, floor: 864 / 941 },
  '이블 포레스트': { aspect: 1672 / 941, floor: 872 / 941 },
  '지하 하수도': { aspect: 1672 / 941, floor: 847 / 941 },
  '코덱 유적': { aspect: 1671 / 940, floor: 840 / 940 },
  '코즈믹 에리어': { aspect: 1672 / 941, floor: 858 / 941 },
  '코퀴토스': { aspect: 1672 / 941, floor: 844 / 941 },
  '팩토리얼 에리어': { aspect: 1672 / 941, floor: 847 / 941 },
  '황천': { aspect: 1672 / 941, floor: 857 / 941 },
}

// Match the contact line after cover scaling and bottom alignment.
export function getMapPresentation(name, width = 1280, height = 512) {
  const resolved = MAP_PRESENTATION[name] ? name : '시작의마을'
  const { aspect, floor } = MAP_PRESENTATION[resolved]
  const imageHeight = Math.max(height, width / aspect)
  return { url: '/맵/' + resolved + '.png', groundY: height - imageHeight * (1 - floor) }
}
