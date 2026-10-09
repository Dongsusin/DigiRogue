// One decision per story; combat rewards are granted only after victory.
export const REGIONAL_BOND_STORIES = [
  {
    "id": "regional-bond-village",
    "maps": [
      "시작의마을"
    ],
    "theme": "town",
    "npc": "에렉몬",
    "title": "요람을 노리는 검은 기어",
    "kind": "지역 방위 의뢰",
    "specialties": [],
    "opening": "요람 앞에 검은 기어가 떨어져 작은 디지몬들이 흩어졌다. 에렉몬이 둥지의 입구를 지키고 있다.",
    "dialogue": "아이들이 돌아올 길을 열어 줘!",
    "routes": [
      {
        "id": "defend",
        "title": "위협을 막고 주민 지키기",
        "ending": "에렉몬과 주민들의 길을 지켜 냈다. 지역 주민들이 다음 보스전에 함께 싸우겠다고 약속했다.",
        "battle": {
          "opponents": [
            "고부리몬"
          ],
          "levelDelta": 1,
          "rule": "일반 전투 · 승리해야 의뢰 보상과 지역 신뢰 획득"
        },
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.6
      },
      {
        "id": "supply",
        "title": "담요와 응급 물품 보태기",
        "ending": "에렉몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "에렉몬과 지역 지형을 읽는 수련",
        "ending": "에렉몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "defense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-lookout",
    "maps": [
      "미하라시 산"
    ],
    "theme": "sky",
    "npc": "호크몬",
    "title": "절벽 중계소의 구조 신호",
    "kind": "지역 방위 의뢰",
    "specialties": [],
    "opening": "절벽의 중계소에서 날개를 다친 주민의 신호가 끊긴다. 호크몬이 바람을 읽어 안전한 길을 짚는다.",
    "dialogue": "상승 기류가 바뀌기 전에 구해야 해.",
    "routes": [
      {
        "id": "defend",
        "title": "위협을 막고 주민 지키기",
        "ending": "호크몬과 주민들의 길을 지켜 냈다. 지역 주민들이 다음 보스전에 함께 싸우겠다고 약속했다.",
        "battle": {
          "opponents": [
            "피코데블몬"
          ],
          "levelDelta": 1,
          "rule": "일반 전투 · 승리해야 의뢰 보상과 지역 신뢰 획득"
        },
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.6
      },
      {
        "id": "supply",
        "title": "중계소의 비상식량 전달",
        "ending": "호크몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "호크몬과 지역 지형을 읽는 수련",
        "ending": "호크몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "speed"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-savanna",
    "maps": [
      "기어사바나"
    ],
    "theme": "forest",
    "npc": "레오몬",
    "title": "초원의 공동 물길",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "레오몬이 초원의 물길을 막은 바위를 옮기고 있다. 마른 풀 사이에서는 영역을 빼앗으려는 발소리가 들린다.",
    "dialogue": "이 물길은 누구 하나의 것이 아니다.",
    "routes": [
      {
        "id": "repair",
        "title": "막힌 급수로 뚫기",
        "ending": "레오몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "여행자들의 물통 채우기",
        "ending": "레오몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "레오몬과 지역 지형을 읽는 수련",
        "ending": "레오몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "defense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-lake",
    "maps": [
      "용의눈호수"
    ],
    "theme": "water",
    "npc": "쉬라몬",
    "title": "갈대밭의 잃어버린 둥지",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "높아진 물결이 갈대밭의 둥지를 떼어 놓았다. 쉬라몬이 떠내려온 알들을 얕은 물에 모아 둔다.",
    "dialogue": "큰 물결이 오기 전에 둥지를 묶어 줘!",
    "routes": [
      {
        "id": "repair",
        "title": "떠내려온 둥지 고정",
        "ending": "쉬라몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "둥지에 방수 덮개 보태기",
        "ending": "쉬라몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "쉬라몬과 지역 지형을 읽는 수련",
        "ending": "쉬라몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "speed"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-sea",
    "maps": [
      "네트의 바다"
    ],
    "theme": "water",
    "npc": "쉬라몬",
    "title": "해상 신호 부표 회수",
    "kind": "지역 방위 의뢰",
    "specialties": [],
    "opening": "쉬라몬의 부표가 그물에 걸렸다. 부표를 잃으면 주민들의 귀환 신호가 깊은 바다에서 끊긴다.",
    "dialogue": "신호가 닿아야 모두 돌아올 수 있어.",
    "routes": [
      {
        "id": "defend",
        "title": "위협을 막고 주민 지키기",
        "ending": "쉬라몬과 주민들의 길을 지켜 냈다. 지역 주민들이 다음 보스전에 함께 싸우겠다고 약속했다.",
        "battle": {
          "opponents": [
            "시드라몬"
          ],
          "levelDelta": 1,
          "rule": "일반 전투 · 승리해야 의뢰 보상과 지역 신뢰 획득"
        },
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.6
      },
      {
        "id": "supply",
        "title": "부표의 전원 교체",
        "ending": "쉬라몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "쉬라몬과 지역 지형을 읽는 수련",
        "ending": "쉬라몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "speed"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-metal",
    "maps": [
      "메탈 엠파이어"
    ],
    "theme": "factory",
    "npc": "가드로몬",
    "title": "정지한 피난 격벽",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "고장 난 격벽이 주민들의 피난로를 가렸다. 가드로몬은 위험 신호를 차단하며 수동 제어기를 붙잡고 있다.",
    "dialogue": "주민 보호를 우선한다. 제어기를 복구하라.",
    "routes": [
      {
        "id": "repair",
        "title": "격벽의 배선 수리",
        "ending": "가드로몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "비상 전원 보급",
        "ending": "가드로몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "가드로몬과 지역 지형을 읽는 수련",
        "ending": "가드로몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "specialDefense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-nightmare",
    "maps": [
      "나이트메어 솔저스"
    ],
    "theme": "dark",
    "npc": "위자몬",
    "title": "지워진 밤길의 표식",
    "kind": "지역 방위 의뢰",
    "specialties": [],
    "opening": "밤길의 표식들이 하나씩 뒤집혀 주민들이 원을 그리며 걷는다. 위자몬이 진짜 등불에 표시를 남겨 둔다.",
    "dialogue": "빛의 방향만 믿지 마. 남긴 약속을 따라가.",
    "routes": [
      {
        "id": "defend",
        "title": "위협을 막고 주민 지키기",
        "ending": "위자몬과 주민들의 길을 지켜 냈다. 지역 주민들이 다음 보스전에 함께 싸우겠다고 약속했다.",
        "battle": {
          "opponents": [
            "고스몬"
          ],
          "levelDelta": 1,
          "rule": "일반 전투 · 승리해야 의뢰 보상과 지역 신뢰 획득"
        },
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.6
      },
      {
        "id": "supply",
        "title": "안전한 등불에 연료 보태기",
        "ending": "위자몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "위자몬과 지역 지형을 읽는 수련",
        "ending": "위자몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "defense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-beetle",
    "maps": [
      "비틀랜드"
    ],
    "theme": "forest",
    "npc": "텐타몬",
    "title": "번데기 쉼터의 경보",
    "kind": "지역 방위 의뢰",
    "specialties": [],
    "opening": "텐타몬의 번데기 쉼터에서 경보가 울렸다. 아직 날개가 마르지 않은 주민들은 통로 밖으로 나갈 수 없다.",
    "dialogue": "새 날개가 다칠 일은 막아야지!",
    "routes": [
      {
        "id": "defend",
        "title": "위협을 막고 주민 지키기",
        "ending": "텐타몬과 주민들의 길을 지켜 냈다. 지역 주민들이 다음 보스전에 함께 싸우겠다고 약속했다.",
        "battle": {
          "opponents": [
            "쿠가몬"
          ],
          "levelDelta": 1,
          "rule": "일반 전투 · 승리해야 의뢰 보상과 지역 신뢰 획득"
        },
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.6
      },
      {
        "id": "supply",
        "title": "탈피 중인 주민에게 영양 보급",
        "ending": "텐타몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "텐타몬과 지역 지형을 읽는 수련",
        "ending": "텐타몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "defense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-scrapyard",
    "maps": [
      "쓰레기의 산"
    ],
    "theme": "factory",
    "npc": "가드로몬",
    "title": "폐기물 아래의 구난 신호",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "가드로몬이 폐기물 더미 아래서 살아 있는 신호를 찾았다. 녹슨 지지대가 흔들려 길이 무너질 듯하다.",
    "dialogue": "구조 대상을 확인했다. 잔해를 제거한다.",
    "routes": [
      {
        "id": "repair",
        "title": "무너진 지지대 다시 세우기",
        "ending": "가드로몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "구조 장비 전달",
        "ending": "가드로몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "가드로몬과 지역 지형을 읽는 수련",
        "ending": "가드로몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "specialDefense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-sewer",
    "maps": [
      "지하 하수도"
    ],
    "theme": "factory",
    "npc": "샤코몬",
    "title": "넘쳐흐르는 정화 수문",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "샤코몬이 오염된 물을 피해 벽에 붙어 있다. 막힌 정화 수문을 열어야 작은 주민들이 둥지로 돌아간다.",
    "dialogue": "맑은 물을 다시 흘려 보내 줘.",
    "routes": [
      {
        "id": "repair",
        "title": "수문에 낀 폐부품 제거",
        "ending": "샤코몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "정화 여과재 보태기",
        "ending": "샤코몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "샤코몬과 지역 지형을 읽는 수련",
        "ending": "샤코몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "specialDefense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-wind",
    "maps": [
      "윈드 가디언즈"
    ],
    "theme": "sky",
    "npc": "호크몬",
    "title": "폭풍 앞의 피난 비행로",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "호크몬이 바뀐 기류를 지도에 표시한다. 폭풍이 닿기 전에 날개가 약한 주민들의 비행로를 열어야 한다.",
    "dialogue": "가장 느린 친구도 함께 도착해야 해.",
    "routes": [
      {
        "id": "repair",
        "title": "피난로의 바람막이 고정",
        "ending": "호크몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "피난 주민의 간식 보급",
        "ending": "호크몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "호크몬과 지역 지형을 읽는 수련",
        "ending": "호크몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "speed"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-codex",
    "maps": [
      "코덱 유적"
    ],
    "theme": "ruins",
    "npc": "위자몬",
    "title": "주민들의 이름을 삼킨 석판",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "주민들의 이름이 석판에서 지워지고 있다. 위자몬이 남은 기억을 모아 되돌릴 기록을 만든다.",
    "dialogue": "이름을 잊기 전에 기록을 지켜 주겠어?",
    "routes": [
      {
        "id": "repair",
        "title": "깨진 기록판 조각 맞추기",
        "ending": "위자몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "보존용 데이터 칩 제공",
        "ending": "위자몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "위자몬과 지역 지형을 읽는 수련",
        "ending": "위자몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "specialDefense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-sanctuary",
    "maps": [
      "아이스 생츄어리"
    ],
    "theme": "ice",
    "npc": "프리지몬",
    "title": "눈보라 속의 온기 쉼터",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "프리지몬이 눈보라에 갇힌 주민들을 얼음 벽 뒤로 모았다. 바람이 벽의 틈을 파고든다.",
    "dialogue": "얼음도 친구를 지키는 벽이 될 수 있지.",
    "routes": [
      {
        "id": "repair",
        "title": "쉼터의 얼음 틈 메우기",
        "ending": "프리지몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "방한 담요 전달",
        "ending": "프리지몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "프리지몬과 지역 지형을 읽는 수련",
        "ending": "프리지몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "specialDefense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-mountain",
    "maps": [
      "무한산"
    ],
    "theme": "volcano",
    "npc": "레오몬",
    "title": "산길을 잇는 마지막 다리",
    "kind": "지역 방위 의뢰",
    "specialties": [],
    "opening": "낙석에 잘린 다리 너머로 구조 요청이 들린다. 레오몬은 주민들이 건널 동안 다리의 기둥을 받친다.",
    "dialogue": "등 뒤의 동료가 건널 길을 지킨다.",
    "routes": [
      {
        "id": "defend",
        "title": "위협을 막고 주민 지키기",
        "ending": "레오몬과 주민들의 길을 지켜 냈다. 지역 주민들이 다음 보스전에 함께 싸우겠다고 약속했다.",
        "battle": {
          "opponents": [
            "티라노몬"
          ],
          "levelDelta": 1,
          "rule": "일반 전투 · 승리해야 의뢰 보상과 지역 신뢰 획득"
        },
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.6
      },
      {
        "id": "supply",
        "title": "산길 구난 물품 보태기",
        "ending": "레오몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "레오몬과 지역 지형을 읽는 수련",
        "ending": "레오몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "defense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-graveyard",
    "maps": [
      "오버델 묘지"
    ],
    "theme": "dark",
    "npc": "엔젤몬",
    "title": "잠든 기억들의 행렬",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "엔젤몬이 묘지에 남은 기억을 조용히 인도한다. 떠돌던 신호가 뒤엉켜 주민들의 귀환길을 막는다.",
    "dialogue": "남은 기억도 평온하게 돌아갈 곳이 필요해.",
    "routes": [
      {
        "id": "repair",
        "title": "기억을 인도하는 표식 복구",
        "ending": "엔젤몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "추모 등불 마련",
        "ending": "엔젤몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "엔젤몬과 지역 지형을 읽는 수련",
        "ending": "엔젤몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "defense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-assembler",
    "maps": [
      "어셈블러 타워"
    ],
    "theme": "factory",
    "npc": "안드로몬",
    "title": "멈춘 주민 이송 승강기",
    "kind": "지역 방위 의뢰",
    "specialties": [],
    "opening": "안드로몬이 주민을 태운 승강기를 붙잡고 있다. 상층부의 회로가 과열돼 비상 제어가 작동하지 않는다.",
    "dialogue": "운반 중인 생명 데이터부터 보호한다.",
    "routes": [
      {
        "id": "defend",
        "title": "위협을 막고 주민 지키기",
        "ending": "안드로몬과 주민들의 길을 지켜 냈다. 지역 주민들이 다음 보스전에 함께 싸우겠다고 약속했다.",
        "battle": {
          "opponents": [
            "가드로몬"
          ],
          "levelDelta": 1,
          "rule": "일반 전투 · 승리해야 의뢰 보상과 지역 신뢰 획득"
        },
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.6
      },
      {
        "id": "supply",
        "title": "냉각 부품 보급",
        "ending": "안드로몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "안드로몬과 지역 지형을 읽는 수련",
        "ending": "안드로몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "specialDefense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-volcano",
    "maps": [
      "부트 화산"
    ],
    "theme": "volcano",
    "npc": "메라몬",
    "title": "불씨를 지키는 냉각 수로",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "메라몬의 작은 불씨들이 용암 분출에 밀려났다. 식은 암석 사이에 안전한 수로를 만들 수 있다.",
    "dialogue": "불꽃도 너무 큰 열기에는 다칠 수 있어.",
    "routes": [
      {
        "id": "repair",
        "title": "용암을 우회시키는 수로 파기",
        "ending": "메라몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "냉각수를 주민에게 나누기",
        "ending": "메라몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "메라몬과 지역 지형을 읽는 수련",
        "ending": "메라몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "defense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-evilforest",
    "maps": [
      "이블 포레스트"
    ],
    "theme": "forest",
    "npc": "가트몬",
    "title": "덩굴에 묶인 귀환길",
    "kind": "지역 방위 의뢰",
    "specialties": [],
    "opening": "가트몬이 길을 잃은 주민을 찾았지만 검은 덩굴이 귀환길을 감았다. 숲의 속삭임은 더 깊은 곳으로 유인한다.",
    "dialogue": "돌아갈 길은 내가 기억해. 같이 열어 줘.",
    "routes": [
      {
        "id": "defend",
        "title": "위협을 막고 주민 지키기",
        "ending": "가트몬과 주민들의 길을 지켜 냈다. 지역 주민들이 다음 보스전에 함께 싸우겠다고 약속했다.",
        "battle": {
          "opponents": [
            "우드몬"
          ],
          "levelDelta": 1,
          "rule": "일반 전투 · 승리해야 의뢰 보상과 지역 신뢰 획득"
        },
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.6
      },
      {
        "id": "supply",
        "title": "길잡이용 표식 보태기",
        "ending": "가트몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "가트몬과 지역 지형을 읽는 수련",
        "ending": "가트몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "defense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-darkweb",
    "maps": [
      "다크 웹"
    ],
    "theme": "dark",
    "npc": "임프몬",
    "title": "해킹당한 주민 통신망",
    "kind": "지역 방위 의뢰",
    "specialties": [],
    "opening": "임프몬이 주민들의 메시지를 훔친 신호를 발견했다. 발신자를 되찾지 못하면 피난 연락이 모두 끊긴다.",
    "dialogue": "장난은 내가 쳐도 이런 짓은 싫다고!",
    "routes": [
      {
        "id": "defend",
        "title": "위협을 막고 주민 지키기",
        "ending": "임프몬과 주민들의 길을 지켜 냈다. 지역 주민들이 다음 보스전에 함께 싸우겠다고 약속했다.",
        "battle": {
          "opponents": [
            "크리사리몬"
          ],
          "levelDelta": 1,
          "rule": "일반 전투 · 승리해야 의뢰 보상과 지역 신뢰 획득"
        },
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.6
      },
      {
        "id": "supply",
        "title": "복구용 데이터 칩 보태기",
        "ending": "임프몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "임프몬과 지역 지형을 읽는 수련",
        "ending": "임프몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "defense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-darkarea",
    "maps": [
      "다크 에리어"
    ],
    "theme": "dark",
    "npc": "가트몬",
    "title": "어둠에 갇힌 빛의 조각",
    "kind": "지역 방위 의뢰",
    "specialties": [],
    "opening": "가트몬이 검은 틈에서 주민들의 빛을 모아 둔다. 조각을 안전하게 옮기면 피난소의 길이 다시 보인다.",
    "dialogue": "이 작은 빛도 버리지 않을 거야.",
    "routes": [
      {
        "id": "defend",
        "title": "위협을 막고 주민 지키기",
        "ending": "가트몬과 주민들의 길을 지켜 냈다. 지역 주민들이 다음 보스전에 함께 싸우겠다고 약속했다.",
        "battle": {
          "opponents": [
            "데블몬"
          ],
          "levelDelta": 1,
          "rule": "일반 전투 · 승리해야 의뢰 보상과 지역 신뢰 획득"
        },
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.6
      },
      {
        "id": "supply",
        "title": "빛을 보존할 용기 전달",
        "ending": "가트몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "가트몬과 지역 지형을 읽는 수련",
        "ending": "가트몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "defense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-cocytus",
    "maps": [
      "코퀴토스"
    ],
    "theme": "ice",
    "npc": "가루몬",
    "title": "얼어붙은 무리의 발자국",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "가루몬이 눈 속에 남은 무리의 발자국을 쫓는다. 갈라진 얼음은 뒤따르는 작은 주민들을 가로막는다.",
    "dialogue": "함께 온 무리는 함께 돌아간다.",
    "routes": [
      {
        "id": "repair",
        "title": "얼음 갈림길에 안전 발판 놓기",
        "ending": "가루몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "동료들의 방한 물품 보태기",
        "ending": "가루몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "가루몬과 지역 지형을 읽는 수련",
        "ending": "가루몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "specialDefense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-central",
    "maps": [
      "센트럴 타운"
    ],
    "theme": "town",
    "npc": "모노크로몬",
    "title": "광장의 비상 보급 행렬",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "모노크로몬이 수레를 끌며 광장의 보급품을 나눈다. 주민들이 몰려 한쪽 골목의 배급이 멈췄다.",
    "dialogue": "짐은 내가 옮길 테니 길을 부탁해!",
    "routes": [
      {
        "id": "repair",
        "title": "배급 골목의 무너진 길 보수",
        "ending": "모노크로몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "배급소에 비축 식량 제공",
        "ending": "모노크로몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "모노크로몬과 지역 지형을 읽는 수련",
        "ending": "모노크로몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "defense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-abyss",
    "maps": [
      "어비스 에리어"
    ],
    "theme": "water",
    "npc": "쥬드몬",
    "title": "심해에서 돌아온 빈 탐사선",
    "kind": "지역 방위 의뢰",
    "specialties": [],
    "opening": "쥬드몬이 돌아온 탐사선의 구조 신호를 확인한다. 끊어진 인양 줄 아래에 아직 주민들이 남아 있다.",
    "dialogue": "망치만큼 단단한 구난 줄이 필요하군.",
    "routes": [
      {
        "id": "defend",
        "title": "위협을 막고 주민 지키기",
        "ending": "쥬드몬과 주민들의 길을 지켜 냈다. 지역 주민들이 다음 보스전에 함께 싸우겠다고 약속했다.",
        "battle": {
          "opponents": [
            "메가시드라몬"
          ],
          "levelDelta": 1,
          "rule": "일반 전투 · 승리해야 의뢰 보상과 지역 신뢰 획득"
        },
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.6
      },
      {
        "id": "supply",
        "title": "인양용 강화 줄 제공",
        "ending": "쥬드몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "쥬드몬과 지역 지형을 읽는 수련",
        "ending": "쥬드몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "speed"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-gearforest",
    "maps": [
      "기어 포레스트"
    ],
    "theme": "forest",
    "npc": "팔몬",
    "title": "마른 정원을 살리는 씨앗",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "팔몬이 물이 끊긴 정원의 씨앗을 그늘로 옮긴다. 씨앗이 자리 잡으려면 굳은 흙을 풀어야 한다.",
    "dialogue": "다시 자라면 모두가 쉴 숲이 될 거야.",
    "routes": [
      {
        "id": "repair",
        "title": "정원의 흙과 물길 돌보기",
        "ending": "팔몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "새싹의 영양분 보태기",
        "ending": "팔몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "팔몬과 지역 지형을 읽는 수련",
        "ending": "팔몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "defense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-factorial",
    "maps": [
      "팩토리얼 에리어"
    ],
    "theme": "factory",
    "npc": "톱니몬",
    "title": "규격이 맞지 않는 구조 부품",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "톱니몬이 구난 장치에 맞는 부품을 골라낸다. 서로 다른 규격 때문에 작은 수리 로봇들이 멈춰 섰다.",
    "dialogue": "맞물리는 부분을 조금만 다듬어 줘!",
    "routes": [
      {
        "id": "repair",
        "title": "구난 부품의 규격 조정",
        "ending": "톱니몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "예비 윤활유와 부품 전달",
        "ending": "톱니몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "톱니몬과 지역 지형을 읽는 수련",
        "ending": "톱니몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "specialDefense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-cosmic",
    "maps": [
      "코즈믹 에리어"
    ],
    "theme": "sky",
    "npc": "스타몬",
    "title": "별빛 항로의 귀환 신호",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "스타몬이 멀어진 귀환 신호를 별빛 항로에 묶는다. 끊긴 중계점 사이로 주민들의 위치가 흩어졌다.",
    "dialogue": "한 점의 빛도 돌아오는 길이 될 수 있어.",
    "routes": [
      {
        "id": "repair",
        "title": "항로의 중계점 다시 연결",
        "ending": "스타몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "중계기에 에너지 보급",
        "ending": "스타몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "스타몬과 지역 지형을 읽는 수련",
        "ending": "스타몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "speed"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-palace",
    "maps": [
      "가디언 팰리스"
    ],
    "theme": "ruins",
    "npc": "홀리엔젤몬",
    "title": "수호벽 밖의 피난민",
    "kind": "지역 방위 의뢰",
    "specialties": [],
    "opening": "홀리엔젤몬이 수호벽을 펼쳐 주민들을 맞는다. 깨진 성문의 봉인 틈으로 위협적인 신호가 스며든다.",
    "dialogue": "수호의 빛은 문밖의 친구에게도 닿아야 한다.",
    "routes": [
      {
        "id": "defend",
        "title": "위협을 막고 주민 지키기",
        "ending": "홀리엔젤몬과 주민들의 길을 지켜 냈다. 지역 주민들이 다음 보스전에 함께 싸우겠다고 약속했다.",
        "battle": {
          "opponents": [
            "레이디데블몬"
          ],
          "levelDelta": 1,
          "rule": "일반 전투 · 승리해야 의뢰 보상과 지역 신뢰 획득"
        },
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.6
      },
      {
        "id": "supply",
        "title": "피난소에 정화 물품 제공",
        "ending": "홀리엔젤몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "홀리엔젤몬과 지역 지형을 읽는 수련",
        "ending": "홀리엔젤몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "specialDefense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-darkfield",
    "maps": [
      "다크 필드"
    ],
    "theme": "dark",
    "npc": "임프몬",
    "title": "검은 균열의 작은 캠프",
    "kind": "지역 방위 의뢰",
    "specialties": [],
    "opening": "임프몬이 균열 주변의 주민들을 모아 작은 캠프를 세웠다. 밤마다 균열에서 들리는 소리가 캠프를 흔든다.",
    "dialogue": "여기 있는 녀석들만큼은 그냥 못 두지!",
    "routes": [
      {
        "id": "defend",
        "title": "위협을 막고 주민 지키기",
        "ending": "임프몬과 주민들의 길을 지켜 냈다. 지역 주민들이 다음 보스전에 함께 싸우겠다고 약속했다.",
        "battle": {
          "opponents": [
            "데블몬"
          ],
          "levelDelta": 1,
          "rule": "일반 전투 · 승리해야 의뢰 보상과 지역 신뢰 획득"
        },
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.6
      },
      {
        "id": "supply",
        "title": "캠프의 응급 물품 보태기",
        "ending": "임프몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "임프몬과 지역 지형을 읽는 수련",
        "ending": "임프몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "defense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-ancient",
    "maps": [
      "겐시 대륙"
    ],
    "theme": "forest",
    "npc": "아구몬",
    "title": "원시 숲의 둥지 이주",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "아구몬이 흔들리는 암벽 아래서 알 둥지를 발견했다. 주민들이 둥지를 옮길 평평한 길을 찾는다.",
    "dialogue": "작은 친구들도 크게 자랄 수 있게 도와줘!",
    "routes": [
      {
        "id": "repair",
        "title": "둥지 이주 통로 다지기",
        "ending": "아구몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "둥지용 보호 덮개 전달",
        "ending": "아구몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "아구몬과 지역 지형을 읽는 수련",
        "ending": "아구몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "defense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-island",
    "maps": [
      "아시노 섬"
    ],
    "theme": "water",
    "npc": "쉬라몬",
    "title": "밀물에 잠긴 섬의 다리",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "쉬라몬이 물에 잠긴 다리 양쪽의 주민들을 오간다. 밀물이 더 높아지기 전에 임시 다리를 놓아야 한다.",
    "dialogue": "물길은 내가 볼게. 다리 위를 부탁해!",
    "routes": [
      {
        "id": "repair",
        "title": "임시 부교의 밧줄 고정",
        "ending": "쉬라몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "섬 주민에게 비상식량 보급",
        "ending": "쉬라몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "쉬라몬과 지역 지형을 읽는 수련",
        "ending": "쉬라몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "speed"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-heaven",
    "maps": [
      "선공계"
    ],
    "theme": "sky",
    "npc": "버드라몬",
    "title": "떠 있는 둥지의 대피 신호",
    "kind": "지역 방위 의뢰",
    "specialties": [],
    "opening": "버드라몬이 불꽃 날개로 멀어진 둥지에 신호를 보낸다. 흩어진 주민들이 착륙할 쉼터가 모자란다.",
    "dialogue": "불꽃을 따라와. 쉴 곳은 함께 만들자.",
    "routes": [
      {
        "id": "defend",
        "title": "위협을 막고 주민 지키기",
        "ending": "버드라몬과 주민들의 길을 지켜 냈다. 지역 주민들이 다음 보스전에 함께 싸우겠다고 약속했다.",
        "battle": {
          "opponents": [
            "아큐라몬"
          ],
          "levelDelta": 1,
          "rule": "일반 전투 · 승리해야 의뢰 보상과 지역 신뢰 획득"
        },
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.6
      },
      {
        "id": "supply",
        "title": "둥지에 보급품 전달",
        "ending": "버드라몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "버드라몬과 지역 지형을 읽는 수련",
        "ending": "버드라몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "speed"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-dragon",
    "maps": [
      "용정궁"
    ],
    "theme": "ruins",
    "npc": "마린엔젤몬",
    "title": "용의 궁전에 남은 작은 목소리",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "마린엔젤몬이 용의 궁전 바깥에서 상처 입은 주민을 달랜다. 무너진 수로 때문에 안전한 길이 끊겼다.",
    "dialogue": "작은 목소리도 여기까지 들릴 수 있어.",
    "routes": [
      {
        "id": "repair",
        "title": "궁전의 외곽 수로 복구",
        "ending": "마린엔젤몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "주민에게 치유 물품 나누기",
        "ending": "마린엔젤몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "마린엔젤몬과 지역 지형을 읽는 수련",
        "ending": "마린엔젤몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "specialDefense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-sacred",
    "maps": [
      "사규산"
    ],
    "theme": "ruins",
    "npc": "위자몬",
    "title": "산의 봉인을 지키는 약속",
    "kind": "주민 지원",
    "specialties": [],
    "opening": "위자몬이 오래된 봉인에 주민들의 이름을 새긴다. 갈라진 돌 사이에서 보호의 신호가 새어 나온다.",
    "dialogue": "봉인보다 소중한 건 그 안의 친구들이야.",
    "routes": [
      {
        "id": "repair",
        "title": "깨진 봉인돌 다시 맞추기",
        "ending": "위자몬과 시설을 복구했다. 주민들이 돌아갈 길이 열리고 함께 싸울 약속이 생겼다.",
        "hpCost": 0.12,
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.4
      },
      {
        "id": "supply",
        "title": "봉인의 기록 재료 보태기",
        "ending": "위자몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "위자몬과 지역 지형을 읽는 수련",
        "ending": "위자몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "specialDefense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  },
  {
    "id": "regional-bond-underworld",
    "maps": [
      "황천"
    ],
    "theme": "dark",
    "npc": "엔젤몬",
    "title": "귀환을 기다리는 마지막 등불",
    "kind": "지역 방위 의뢰",
    "specialties": [],
    "opening": "엔젤몬이 황천의 갈림길에 마지막 등불을 세웠다. 지친 주민들의 흔적이 어둠 속에서 희미해진다.",
    "dialogue": "돌아가려는 마음을 잊지 않게 지켜 주자.",
    "routes": [
      {
        "id": "defend",
        "title": "위협을 막고 주민 지키기",
        "ending": "엔젤몬과 주민들의 길을 지켜 냈다. 지역 주민들이 다음 보스전에 함께 싸우겠다고 약속했다.",
        "battle": {
          "opponents": [
            "레이디데블몬"
          ],
          "levelDelta": 1,
          "rule": "일반 전투 · 승리해야 의뢰 보상과 지역 신뢰 획득"
        },
        "trust": 2,
        "regionTrust": 2,
        "goldReward": 0.6
      },
      {
        "id": "supply",
        "title": "등불에 정화 에너지 보태기",
        "ending": "엔젤몬이 필요한 물품을 주민들에게 나누었다. 남은 보급품으로 일행도 상처를 돌봤다.",
        "goldCost": 0.8,
        "heal": 0.2,
        "trust": 1,
        "regionTrust": 1
      },
      {
        "id": "train",
        "title": "엔젤몬과 지역 지형을 읽는 수련",
        "ending": "엔젤몬과 안전한 길을 걸으며 주변의 흐름을 익혔다. 다음 전투에 쓸 호흡이 맞아들었다.",
        "stats": [
          "defense"
        ],
        "stages": 3,
        "trust": 1,
        "regionTrust": 1
      }
    ]
  }
]
