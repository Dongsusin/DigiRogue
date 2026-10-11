export const bgmTracks = [
  { title: '디지털 새벽', file: 'digital-dawn', scene: 'title', description: '타이틀 · 빛나는 신스와 새로운 모험의 테마' },
  { title: '패킷 초원', file: 'packet-meadow', scene: 'exploration', description: '탐험 · 가벼운 리듬과 호기심 어린 멜로디' },
  { title: '서킷 브레이커', file: 'circuit-breakers', scene: 'battle', description: '전투 · 빠른 비트와 힘찬 디지털 록' },
  { title: '오버클럭', file: 'overclock-apex', scene: 'boss', description: '보스 · 묵직한 베이스와 긴장감 있는 전개' },
  { title: '돌아오는 신호', file: 'homeward-signal', scene: 'rest', description: '휴식 · 따뜻한 건반과 잔잔한 신스' },
  { title: '네온 지평선', file: 'neon-horizon', scene: 'title', introducedIn: 3, description: '타이틀 · 반짝이는 아르페지오와 넓게 펼쳐지는 모험의 선율' },
  { title: '프리즘 숲길', file: 'prism-canopy', scene: 'exploration', introducedIn: 3, description: '탐험 · 맑은 벨과 경쾌한 리듬이 이끄는 디지털 숲길' },
  { title: '펄스 러너', file: 'pulse-runners', scene: 'battle', introducedIn: 3, description: '전투 · 달리는 베이스와 힘 있는 신스가 맞물리는 배틀 테마' },
  { title: '싱귤래리티 코어', file: 'singularity-core', scene: 'boss', introducedIn: 3, description: '보스 · 묵직한 드럼과 긴장감 있는 선율의 최종 돌파' },
  { title: '별빛 항구', file: 'starlight-harbor', scene: 'rest', introducedIn: 3, description: '휴식 · 부드러운 피아노와 별빛 같은 신스의 귀환' },
].map(({ file, introducedIn = 2, ...track }) => ({ ...track, introducedIn, url: `/BGM/ai/${file}.ogg` }))

// A disabled scene theme never returns implicitly. Other enabled original
// music can accompany that scene; an empty selection remains silent.
export const getSceneBgmTracks = (tracks, scene = 'title') => {
  const sceneTracks = tracks.filter(track => track.scene === scene)
  return sceneTracks.length ? sceneTracks : tracks
}
