// Shared policy for the client, history audit and generated RTDB validations.
// Portable patterns must not use lookarounds/backreferences unsupported by RTDB.
export const CHAT_COOLDOWN = 4000
export const CHAT_REPEAT_WINDOW = 60000
export const CHAT_BURST_WINDOW = 30000
export const CHAT_BURST_LIMIT = 5
export const CHAT_RECENT_LIMIT = 10
export const CHAT_IGNORED_CHARACTERS = ['\t', '\n', '\r', '\v', '\f', '\u00a0', '\u1680', '\u2028', '\u2029', '\u202f', '\u205f', '\u3000', '\ufeff', ...Array.from({length:11}, (_,i)=>String.fromCharCode(0x2000+i)), ..." .,!?:;~_-+*/\\|()[]{}'\"`"]
export const CHAT_WORD_EXCEPTIONS = ['시발점']
const boundary = '[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]'
const gap = boundary + '*'
export const CHAT_PROFANITY_PATTERNS = [
  // Plain 시 needs word context: preserve 혹시 빨리 / 성공 시 발동.
  `${boundary}시[발빨]`, `${boundary}시${gap}[발빨]${boundary}`, `${boundary}시${gap}[발빨](놈|년|련|새끼|넘|같)`,
  `[씨씹쒸][발빨]`, `${boundary}[씨씹쒸쉬]${gap}[발빨]`, `${boundary}시[1이ㅣ]${gap}발`, `[씨씹]${gap}팔`,
  `ㅅ${gap}ㅂ`, `ㅂ${gap}ㅅ`, `개${gap}새${gap}끼`,
  `[병븅]${gap}신`, `지${gap}랄`, '좆',
  `f${gap}u${gap}c${gap}k`, `b${gap}i${gap}t${gap}c${gap}h`,
  `a${gap}s${gap}s${gap}h${gap}o${gap}l${gap}e`,
]
export const CHAT_FLOOD_PATTERNS = [
  ...[...'abcdefghijklmnopqrstuvwxyz0123456789ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ가나다라마바사아자차카타파하진화공격방어승리패배사기강한약몬디지안녕메시대전'.split('').filter((char,index,all)=>all.indexOf(char)===index)].map(char => char.repeat(12)),
  '[!?.,~]'.repeat(16), ...['도배','승리','진화','공격','안녕'].map(word=>word.repeat(6)), 'ㅋ'.repeat(12), 'ㅎ'.repeat(12),
]
export const CHAT_UNSAFE_CHARACTERS = '[\u0000-\u001f\u007f\u1100-\u11ff\uff01-\uff5e]'
export const CHAT_FORBIDDEN_CHARACTERS = [...Array.from({length:5},(_,i)=>String.fromCharCode(0x200b+i)), ...Array.from({length:5},(_,i)=>String.fromCharCode(0x202a+i)), ...Array.from({length:16},(_,i)=>String.fromCharCode(0x2060+i)), ...Array.from({length:11},(_,i)=>String.fromCharCode(0x2000+i)), '\u00a0', '\u1680', '\u2028', '\u2029', '\u202f', '\u205f', '\u3000', '\ufeff']
const profanity = new RegExp(CHAT_PROFANITY_PATTERNS.join('|'), 'i')
const flood = new RegExp(CHAT_FLOOD_PATTERNS.join('|'), 'i')

export function normalizeChatCharacters(value) {
  return String(value ?? '').normalize('NFC').replace(/[！-～]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
}
export function chatTextKey(value) {
  let text = normalizeChatCharacters(value).toLowerCase()
  for (const char of CHAT_IGNORED_CHARACTERS) text = text.split(char).join('')
  return text
}
export function chatContentViolation(value) {
  let text = normalizeChatCharacters(value)
  for (const word of CHAT_WORD_EXCEPTIONS) text = text.split(word).join('')
  if (profanity.test(` ${text} `)) return '비속어가 포함되어 있습니다. 다른 표현을 사용해 주세요.'
  if (flood.test(text) || /(.)\1{11}/u.test(text) || /(.{2,30})\1{5}/u.test(text)) return '같은 글자나 문장을 반복하는 도배는 보낼 수 없습니다.'
  return ''
}
function moderationError(message) {
  return Object.assign(new Error(message), { code: 'CHAT_MODERATION' })
}
export function assertChatRate(text, rate, now) {
  if (!rate) return
  if (Number.isFinite(rate.createdAt) && now - rate.createdAt < CHAT_COOLDOWN) throw moderationError('메시지는 4초마다 보낼 수 있습니다.')
  const recent = Object.values(rate.recent ?? {}).filter(row => row && Number.isFinite(row.createdAt) && row.createdAt > 0)
  const key = chatTextKey(text)
  if (recent.some(row => row.createdAt > now - CHAT_REPEAT_WINDOW && row.text === key)) throw moderationError('같은 메시지는 1분 뒤에 다시 보낼 수 있습니다.')
  if (recent.filter(row => row.createdAt > now - CHAT_BURST_WINDOW).length >= CHAT_BURST_LIMIT) throw moderationError('메시지는 30초 동안 5개까지 보낼 수 있습니다. 잠시 쉬어 주세요.')
}
export function nextChatRateHistory(text, rate, createdAt) {
  return Object.fromEntries(Array.from({ length: CHAT_RECENT_LIMIT }, (_, index) => {
    const previous = rate?.recent?.[index - 1]
    return [index, index === 0 ? { text: chatTextKey(text), createdAt }
      : { text: typeof previous?.text === 'string' ? previous.text : '', createdAt: Number.isFinite(previous?.createdAt) ? previous.createdAt : 0 }]
  }))
}
// A reviewable plan, with no writes. UID-based checks preserve greetings from
// different players and keep the earliest normal message of a repeated burst.
export function inspectChatHistory(rows) {
  const kept = [], removed = [], byUser = new Map()
  for (const row of [...rows].sort((a, b) => a.seq - b.seq)) {
    let reason = chatContentViolation(row.name) || chatContentViolation(row.text)
    const recent = byUser.get(row.uid) ?? []
    if (!reason) {
      try { assertChatRate(row.text, { createdAt: recent.at(-1)?.createdAt, recent }, row.createdAt) }
      catch (cause) { reason = cause.message }
    }
    if (reason) removed.push({ row, reason })
    else {
      kept.push(row)
      byUser.set(row.uid, [...recent, { text: chatTextKey(row.text), createdAt: row.createdAt }].slice(-CHAT_RECENT_LIMIT))
    }
  }
  return { kept, removed }
}
