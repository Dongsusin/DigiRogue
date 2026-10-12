import { chatContentViolation, inspectChatHistory, nextChatRateHistory, normalizeChatCharacters } from './chatModeration.js'
export { CHAT_COOLDOWN } from './chatModeration.js'
export const CHAT_LIMIT = 40
export const CHAT_LENGTH = 200
const invisible = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g
export function cleanChatText(value) {
  const text = normalizeChatCharacters(value).replace(invisible, '').replace(/\s+/g, ' ').trim()
  if (!text) throw new Error('내용을 입력해 주세요.')
  if (text.length > CHAT_LENGTH) throw new Error('메시지는 200자까지 입력할 수 있습니다.')
  const violation = chatContentViolation(text)
  if (violation) throw new Error(violation)
  return text
}
export function cleanChatName(value) {
  const name = normalizeChatCharacters(value).replace(invisible, '').replace(/\s+/g, ' ').trim()
  if (!name || name.length > 16) throw new Error('채팅 이름은 1~16자로 입력해 주세요.')
  const violation = chatContentViolation(name)
  if (violation) throw new Error(violation)
  return name
}
export function chatAlias(identity) {
  let hash = 2166136261
  for (const char of String(identity?.uid ?? 'guest')) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return (identity?.isAnonymous ? '게스트-' : '테이머-') + (hash >>> 0).toString(36).padStart(6, '0').slice(-6)
}
export function orderedMessages(rows) {
  const unique = new Map()
  for (const row of rows ?? []) {
    if (row && Number.isSafeInteger(row.seq) && row.seq > 0 && typeof row.uid === 'string' &&
      typeof row.name === 'string' && row.name.length > 0 && row.name.length <= 16 &&
      typeof row.text === 'string' && row.text.length > 0 && row.text.length <= CHAT_LENGTH &&
      Number.isFinite(row.createdAt)) unique.set(row.seq, row)
  }
  return inspectChatHistory([...unique.values()]).kept.slice(-CHAT_LIMIT)
}
export function onlinePlayers(presence) {
  return Object.values(presence ?? {}).filter(connections => connections && Object.values(connections).some(value => value === true)).length
}
export function buildChatUpdate({ seq, uid, name, text, rate = null }) {
  if (!Number.isSafeInteger(seq) || seq < 1 || !/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) throw new Error('채팅 연결을 확인해 주세요.')
  const createdAt = { '.sv': 'timestamp' }
  return {
    head: { seq, uid, createdAt },
    ['messages/' + (seq % CHAT_LIMIT)]: { seq, uid, name: cleanChatName(name), text: cleanChatText(text), createdAt },
    ['rates/' + uid]: { seq, createdAt, recent: nextChatRateHistory(cleanChatText(text), rate, createdAt) },
  }
}

export function collectSnapshotChildren(snapshot) {
  const rows = new Map()
  // Firebase forEach stops on a truthy return; Map.set must not be returned.
  snapshot.forEach(child => { rows.set(child.key, child.val()) })
  return rows
}
