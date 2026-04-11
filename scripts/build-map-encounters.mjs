import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const mapPath = path.join(projectRoot, 'data', 'map.json');
const digimonDir = path.join(projectRoot, 'data', '디지몬');

const stages = ['유아기', '유년기', '성장기', '성숙기', '완전체', '궁극체'];

const groupConfig = {
  '1': [
    { stage: '유아기', count: 2 },
    { stage: '유년기', count: 2 },
  ],
  '2': [
    { stage: '유년기', count: 2 },
    { stage: '성장기', count: 2 },
  ],
  '3': [
    { stage: '성장기', count: 2 },
    { stage: '성숙기', count: 2 },
  ],
  '4': [
    { stage: '성숙기', count: 2 },
    { stage: '완전체', count: 2 },
  ],
  '5': [
    { stage: '완전체', count: 2 },
    { stage: '궁극체', count: 2 },
  ],
  '6': [{ stage: '궁극체', count: 4 }],
};

const mapThemes = {
  '시작의마을': { attrs: ['빛', '물', '바람', '무'], keywords: ['토코', '포요', '둥실', '구미', '코코', '코로', '꼬마'] },
  '미하라시 산': { attrs: ['바람', '흙', '화염', '무'], keywords: ['버드', '토리', '팔코', '가오', '레오', '산', '드라'] },
  '기어사바나': { attrs: ['바람', '무', '강철', '화염'], keywords: ['가오', '레오', '도루', '기어', '아구', '가지', '사바나'] },
  '용의눈호수': { attrs: ['물', '빛', '얼음', '무'], keywords: ['샤코', '쉬라', '시드라', '고래', '개굴', '토코', '물'] },
  '네트의 바다': { attrs: ['물', '강철', '빛', '무'], keywords: ['시드라', '샤코', '고래', '메탈', '도루', '넷', '바다'] },
  '메탈 엠파이어': { attrs: ['강철', '번개', '무'], keywords: ['메탈', '가드', '안드로', '기계', '캐논', '도루', '머신'] },
  '나이트메어 솔저스': { attrs: ['어둠', '무'], keywords: ['데블', '다크', '블랙', '고스', '위자', '임프', '드라큐'] },
  '비틀랜드': { attrs: ['나무', '번개', '바람', '무'], keywords: ['캅테리', '쿠네', '도쿠', '니드', '라라', '텐타', '비틀'] },
  '쓰레기의 산': { attrs: ['강철', '어둠', '흙', '무'], keywords: ['메탈', '가드', '기계', '디지', '블랙', '스컬', '쓰레기'] },
  '지하 하수도': { attrs: ['물', '어둠', '무'], keywords: ['샤코', '쉬라', '개굴', '시드라', '드라큐', '고스', '하수'] },
  '윈드 가디언즈': { attrs: ['바람', '빛', '무'], keywords: ['버드', '토리', '팔코', '가루다', '가오', '치린', '레이브'] },
  '코덱 유적': { attrs: ['흙', '빛', '강철', '무'], keywords: ['도루', '류우', '가드', '토우', '아구', '그레이', '유적'] },
  '아이스 생츄어리': { attrs: ['얼음', '물', '빛', '무'], keywords: ['가루', '펭귄', '아이스', '블루', '로프', '토코', '생츄어리'] },
  '무한산': { attrs: ['어둠', '흙', '강철', '무'], keywords: ['다크', '데블', '메탈', '스컬', '디아블', '블랙', '산'] },
  '오버델 묘지': { attrs: ['어둠', '흙', '무'], keywords: ['데블', '고스', '위자', '레이디데블', '스컬', '드라큐', '묘지'] },
  '어셈블러 타워': { attrs: ['강철', '번개', '빛', '무'], keywords: ['메탈', '가드', '안드로', '기계', '타워', '어셈', '캐논'] },
  '부트 화산': { attrs: ['화염', '흙', '강철', '무'], keywords: ['그레이', '길', '아구', '티라노', '가이오', '다이노', '화산'] },
  '이블 포레스트': { attrs: ['어둠', '나무', '무'], keywords: ['팔몬', '라라', '플로라', '릴리', '로제', '도쿠', '이블'] },
  '다크 웹': { attrs: ['어둠', '강철', '무'], keywords: ['다크', '디아블', '메탈', '가드', '블랙', '기계', '웹'] },
  '다크 에리어': { attrs: ['어둠', '무'], keywords: ['데블', '다크', '벨페', '베르제브', '디아블', '루체', '스컬'] },
  '코퀴토스': { attrs: ['얼음', '어둠', '물', '무'], keywords: ['가루', '아이스', '블루', '펭귄', '다크', '코퀴', '쉬라'] },
  '센트럴 타운': { attrs: ['빛', '강철', '무'], keywords: ['가트', '테일', '토우', '안드로', '가드', '도루', '센트럴'] },
  '어비스 에리어': { attrs: ['어둠', '물', '무'], keywords: ['넵툰', '시드라', '샤코', '데블', '다크', '리바이', '어비스'] },
  '기어 포레스트': { attrs: ['강철', '나무', '무'], keywords: ['가드', '메탈', '캅테리', '라라', '니드', '릴리', '기어'] },
  '팩토리얼 에리어': { attrs: ['강철', '번개', '무'], keywords: ['메탈', '안드로', '가드', '기계', '캐논', '팩토리', '머신'] },
  '코즈믹 에리어': { attrs: ['빛', '바람', '무'], keywords: ['오메가', '알포스', '쿠다', '치린', '샤인', '엔젤', '코즈믹'] },
  '가디언 팰리스': { attrs: ['빛', '강철', '무'], keywords: ['오메가', '세라피', '오파니', '가드', '알포스', '저스티', '팰리스'] },
  '다크 필드': { attrs: ['어둠', '흙', '무'], keywords: ['다크', '데블', '티라노', '그라운드', '블랙', '가이오', '필드'] },
  '겐시 대륙': { attrs: ['흙', '화염', '물', '무'], keywords: ['드라', '아구', '그레이', '다이노', '가이오', '티라노', '대륙'] },
  '아시노 섬': { attrs: ['물', '바람', '나무', '무'], keywords: ['고래', '샤코', '시드라', '개굴', '라라', '토리', '섬'] },
  '선공계': { attrs: ['빛', '화염', '바람', '무'], keywords: ['샤인', '피닉스', '가루다', '엔젤', '브이', '오메가', '선공'] },
  '용정궁': { attrs: ['물', '빛', '무'], keywords: ['넵툰', '시드라', '샤코', '개굴', '쿠다', '토우', '용정'] },
  '사규산': { attrs: ['흙', '화염', '강철', '무'], keywords: ['다이노', '그레이', '메탈', '류우', '가이오', '도루', '산'] },
  '황천': { attrs: ['어둠', '무'], keywords: ['벨페', '데블', '다크', '루체', '베르제브', '디아블', '황천'] },
};

function hashText(text) {
  let hash = 0;
  for (const char of text) {
    hash = (hash * 31 + char.codePointAt(0)) % 1000003;
  }
  return hash;
}

async function readJson(fullPath) {
  const text = await fs.readFile(fullPath, 'utf8');
  return JSON.parse(text.replace(/^\uFEFF/, ''));
}

async function loadConnections() {
  const raw = await readJson(mapPath);
  const connections = {};

  for (const [mapName, value] of Object.entries(raw)) {
    if (Array.isArray(value)) {
      connections[mapName] = value;
      continue;
    }

    if (value && Array.isArray(value.이동가능한맵)) {
      connections[mapName] = value.이동가능한맵;
    }
  }

  return connections;
}

async function loadDigimonPools() {
  const pools = {};

  for (const stage of stages) {
    const fullPath = path.join(digimonDir, `${stage}.json`);
    pools[stage] = await readJson(fullPath);
  }

  return pools;
}

function scoreDigimon(digimon, theme, mapName, groupKey, stage, usedNames) {
  let score = hashText(`${mapName}:${groupKey}:${stage}:${digimon.이름}`) % 19;

  const attrIndex = theme.attrs.indexOf(digimon.속성);
  if (attrIndex >= 0) {
    score += 140 - attrIndex * 25;
  } else if (digimon.속성 === '무') {
    score += 28;
  }

  for (const keyword of theme.keywords) {
    if (digimon.이름.includes(keyword)) {
      score += 24;
    }
  }

  if (usedNames.has(digimon.이름)) {
    score -= 18;
  }

  score += digimon.기술.length * 2;

  if (digimon.타입 === '프리') {
    score += 3;
  }

  if (digimon.타입 === '불명') {
    score += 1;
  }

  return score;
}

function pickDigimons(pool, count, theme, mapName, groupKey, stage, usedNames) {
  const ranked = [...pool].sort((left, right) => {
    const scoreDiff =
      scoreDigimon(right, theme, mapName, groupKey, stage, usedNames) -
      scoreDigimon(left, theme, mapName, groupKey, stage, usedNames);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return left.이름.localeCompare(right.이름, 'ko');
  });

  const picks = [];
  for (const digimon of ranked) {
    if (picks.length >= count) {
      break;
    }

    picks.push(digimon);
  }

  if (picks.length < count) {
    for (const digimon of ranked) {
      if (picks.length >= count) {
        break;
      }

      if (picks.some((picked) => picked.이름 === digimon.이름)) {
        continue;
      }

      picks.push(digimon);
    }
  }

  return picks;
}

async function main() {
  const connections = await loadConnections();
  const pools = await loadDigimonPools();
  const output = {};

  for (const [mapName, linkedMaps] of Object.entries(connections)) {
    const theme = mapThemes[mapName] ?? { attrs: ['무'], keywords: [] };
    const usedNames = new Set();
    const encounters = {};

    for (const [groupKey, config] of Object.entries(groupConfig)) {
      const groupDigimons = [];

      for (const spec of config) {
        const picks = pickDigimons(pools[spec.stage], spec.count, theme, mapName, groupKey, spec.stage, usedNames);
        for (const picked of picks) {
          groupDigimons.push(picked.이름);
          usedNames.add(picked.이름);
        }
      }

      encounters[groupKey] = groupDigimons;
    }

    output[mapName] = {
      이동가능한맵: linkedMaps,
      등장디지몬: encounters,
    };
  }

  await fs.writeFile(mapPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
