import { parseHallRecord, rankHallRecords, HALL_MODES, HALL_LIMIT } from '../progression/hallOfFame.js'

// One bounded query per open/refresh; uploads happen only on a personal-best clear.
// REST requests time out instead of queuing a late SDK write after an account switch.
export function createHallClient({ baseUrl, getToken, fetchImpl = globalThis.fetch, timeoutMs = 10000 }) {
  async function request(path, { method = 'GET', body, etag, query = '', readEtag = false } = {}) {
    const token = await getToken()
    const response = await fetchImpl(baseUrl.replace(/\/$/, '') + '/' + path + '.json?auth=' + encodeURIComponent(token) + query, {
      method, cache: 'no-store', signal: AbortSignal.timeout(timeoutMs),
      headers: { 'Content-Type': 'application/json', ...(readEtag ? { 'X-Firebase-ETag': 'true' } : {}), ...(etag ? { 'If-Match': etag } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (response.status === 412) return { conflict: true }
    if (!response.ok) throw new Error('명예의 전당에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    return { value: await response.json(), etag: response.headers.get('etag') }
  }
  const pathFor = mode => {
    if (!HALL_MODES.includes(mode)) throw new Error('잘못된 모드입니다.')
    return 'hallOfFame/' + mode + '/entries'
  }
  return {
    async list(mode) {
      const { value } = await request(pathFor(mode), { query: '&orderBy=' + encodeURIComponent('"totalTurns"') + '&limitToFirst=' + HALL_LIMIT })
      return rankHallRecords(Object.entries(value ?? {}).map(([playerKey, row]) => ({ ...row, team: JSON.stringify(Object.values(row.team ?? {}).map(unit => unit.isEgg ? unit : ({ ...unit, skills: Object.values(unit.skills ?? {}), items: Object.values(unit.items ?? {}) }))), playerKey })), mode)
    },
    async submit(uid, record) {
      if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid) || !parseHallRecord(record)) throw new Error('클리어 기록을 확인하지 못했습니다.')
      const path = pathFor(record.mode) + '/' + uid
      for (let attempt = 0; attempt < 3; attempt++) {
        const current = await request(path, { readEtag: true })
        if (current.value && Number.isSafeInteger(current.value.totalTurns) && current.value.totalTurns <= record.totalTurns) return { improved: false }
        if (!current.etag) throw new Error('기록을 안전하게 저장하지 못했습니다.')
        const { members, playerKey, ...data } = record
        const result = await request(path, { method: 'PUT', etag: current.etag, body: { ...data, team: parseHallRecord(record).members, clearedAt: { '.sv': 'timestamp' } } })
        if (!result.conflict) return { improved: true }
      }
      throw new Error('다른 창에서 기록이 변경됐습니다. 다시 시도해 주세요.')
    },
  }
}
