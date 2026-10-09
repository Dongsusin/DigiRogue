// Regional residents are temporary battle allies, never collectible party members.
export const REGIONAL_SUPPORT_MIN_TRUST = 2
export const REGIONAL_SUPPORT_PROFILES = Object.freeze([
  {
    "mapName": "시작의마을",
    "id": "village",
    "name": "에렉몬",
    "theme": "town"
  },
  {
    "mapName": "미하라시 산",
    "id": "lookout",
    "name": "호크몬",
    "theme": "sky"
  },
  {
    "mapName": "기어사바나",
    "id": "savanna",
    "name": "레오몬",
    "theme": "forest"
  },
  {
    "mapName": "용의눈호수",
    "id": "lake",
    "name": "쉬라몬",
    "theme": "water"
  },
  {
    "mapName": "네트의 바다",
    "id": "sea",
    "name": "쉬라몬",
    "theme": "water"
  },
  {
    "mapName": "메탈 엠파이어",
    "id": "metal",
    "name": "가드로몬",
    "theme": "factory"
  },
  {
    "mapName": "나이트메어 솔저스",
    "id": "nightmare",
    "name": "위자몬",
    "theme": "dark"
  },
  {
    "mapName": "비틀랜드",
    "id": "beetle",
    "name": "텐타몬",
    "theme": "forest"
  },
  {
    "mapName": "쓰레기의 산",
    "id": "scrapyard",
    "name": "가드로몬",
    "theme": "factory"
  },
  {
    "mapName": "지하 하수도",
    "id": "sewer",
    "name": "샤코몬",
    "theme": "factory"
  },
  {
    "mapName": "윈드 가디언즈",
    "id": "wind",
    "name": "호크몬",
    "theme": "sky"
  },
  {
    "mapName": "코덱 유적",
    "id": "codex",
    "name": "위자몬",
    "theme": "ruins"
  },
  {
    "mapName": "아이스 생츄어리",
    "id": "sanctuary",
    "name": "프리지몬",
    "theme": "ice"
  },
  {
    "mapName": "무한산",
    "id": "mountain",
    "name": "레오몬",
    "theme": "volcano"
  },
  {
    "mapName": "오버델 묘지",
    "id": "graveyard",
    "name": "엔젤몬",
    "theme": "dark"
  },
  {
    "mapName": "어셈블러 타워",
    "id": "assembler",
    "name": "안드로몬",
    "theme": "factory"
  },
  {
    "mapName": "부트 화산",
    "id": "volcano",
    "name": "메라몬",
    "theme": "volcano"
  },
  {
    "mapName": "이블 포레스트",
    "id": "evilforest",
    "name": "가트몬",
    "theme": "forest"
  },
  {
    "mapName": "다크 웹",
    "id": "darkweb",
    "name": "임프몬",
    "theme": "dark"
  },
  {
    "mapName": "다크 에리어",
    "id": "darkarea",
    "name": "가트몬",
    "theme": "dark"
  },
  {
    "mapName": "코퀴토스",
    "id": "cocytus",
    "name": "가루몬",
    "theme": "ice"
  },
  {
    "mapName": "센트럴 타운",
    "id": "central",
    "name": "모노크로몬",
    "theme": "town"
  },
  {
    "mapName": "어비스 에리어",
    "id": "abyss",
    "name": "쥬드몬",
    "theme": "water"
  },
  {
    "mapName": "기어 포레스트",
    "id": "gearforest",
    "name": "팔몬",
    "theme": "forest"
  },
  {
    "mapName": "팩토리얼 에리어",
    "id": "factorial",
    "name": "톱니몬",
    "theme": "factory"
  },
  {
    "mapName": "코즈믹 에리어",
    "id": "cosmic",
    "name": "스타몬",
    "theme": "sky"
  },
  {
    "mapName": "가디언 팰리스",
    "id": "palace",
    "name": "홀리엔젤몬",
    "theme": "ruins"
  },
  {
    "mapName": "다크 필드",
    "id": "darkfield",
    "name": "임프몬",
    "theme": "dark"
  },
  {
    "mapName": "겐시 대륙",
    "id": "ancient",
    "name": "아구몬",
    "theme": "forest"
  },
  {
    "mapName": "아시노 섬",
    "id": "island",
    "name": "쉬라몬",
    "theme": "water"
  },
  {
    "mapName": "선공계",
    "id": "heaven",
    "name": "버드라몬",
    "theme": "sky"
  },
  {
    "mapName": "용정궁",
    "id": "dragon",
    "name": "마린엔젤몬",
    "theme": "ruins"
  },
  {
    "mapName": "사규산",
    "id": "sacred",
    "name": "위자몬",
    "theme": "ruins"
  },
  {
    "mapName": "황천",
    "id": "underworld",
    "name": "엔젤몬",
    "theme": "dark"
  }
])
export const REGIONAL_SUPPORT_BY_MAP = new Map(REGIONAL_SUPPORT_PROFILES.map(profile => [profile.mapName, profile]))
