import { CHAT_PROFANITY_PATTERNS, CHAT_FLOOD_PATTERNS, CHAT_UNSAFE_CHARACTERS, CHAT_FORBIDDEN_CHARACTERS, CHAT_WORD_EXCEPTIONS, CHAT_IGNORED_CHARACTERS, CHAT_COOLDOWN, CHAT_REPEAT_WINDOW, CHAT_BURST_WINDOW, CHAT_BURST_LIMIT, CHAT_RECENT_LIMIT } from '../../src/community/chatModeration.js'
// RTDB lexing strips literal format marks even inside regex character classes.
// String unicode escapes retain their meaning; regex unicode escapes do not.
const quote = value => JSON.stringify(value).replace(/[\u007f-\uffff]/g, char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'))
const key = expression => CHAT_IGNORED_CHARACTERS.reduce((out, char) => out + '.replace(' + quote(char) + ', "")', expression + '.toLowerCase()')
function contentValidation(maxLength) {
 const raw = 'newData.val()'
 const forbidden = CHAT_FORBIDDEN_CHARACTERS.map(char => ' && !' + raw + '.contains(' + quote(char) + ')').join('')
 const checked = '(" " + ' + CHAT_WORD_EXCEPTIONS.reduce((out, word) => out + '.replace(' + quote(word) + ', "")', raw) + ' + " ")'
 return 'newData.isString() && ' + raw + '.length > 0 && ' + raw + '.length <= ' + maxLength + ' && ' + raw + '.matches(/.*[^ ].*/) && !' + raw + '.matches(/.*' + CHAT_UNSAFE_CHARACTERS + '.*/)' + forbidden + ' && !' + checked + '.matches(/.*(' + CHAT_PROFANITY_PATTERNS.join('|') + ').*/i) && !' + raw + '.matches(/.*(' + CHAT_FLOOD_PATTERNS.join('|') + ').*/i)'
}
export function applyChatRules(rules) {
 const community = rules.rules.community
 community.messages.$slot.name['.validate'] = contentValidation(16)
 community.messages.$slot.text['.validate'] = contentValidation(200)
 const newest = "newData.child('recent/0')"
 const checks = [
  "newData.hasChildren(['seq','createdAt','recent'])",
  "(!data.exists() || data.child('createdAt').val() <= now - " + CHAT_COOLDOWN + ')',
  "newData.child('createdAt').val() === now",
  "newData.child('seq').val() === (root.child('community/head/seq').exists() ? root.child('community/head/seq').val() + 1 : 1)",
  "newData.parent().parent().child('head/seq').val() === newData.child('seq').val()",
  "newData.parent().parent().child('head/uid').val() === auth.uid",
  "newData.parent().parent().child('head/createdAt').val() === now",
  "(!data.child('recent/" + (CHAT_BURST_LIMIT - 1) + "/createdAt').exists() || data.child('recent/" + (CHAT_BURST_LIMIT - 1) + "/createdAt').val() <= now - " + CHAT_BURST_WINDOW + ')',
 ]
 for (let i = 0; i < CHAT_RECENT_LIMIT; i++) checks.push("(!data.child('recent/" + i + "/createdAt').exists() || data.child('recent/" + i + "/createdAt').val() <= now - " + CHAT_REPEAT_WINDOW + " || data.child('recent/" + i + "/text').val() !== " + newest + ".child('text').val())")
 const recent = { '.validate': 'newData.hasChildren(' + JSON.stringify(Array.from({length:CHAT_RECENT_LIMIT}, (_,i)=>String(i))) + ')', '$other': { '.validate': false } }
 for (let i = 0; i < CHAT_RECENT_LIMIT; i++) {
  const old = "data.parent().parent().parent().child('recent/" + (i - 1) + "')"
  recent[i] = {
   '.validate': "newData.hasChildren(['text','createdAt'])",
   text: { '.validate': 'newData.isString() && newData.val() === ' + (i === 0 ? key("newData.parent().parent().parent().parent().parent().child('messages/' + (newData.parent().parent().parent().child('seq').val() % 40)).child('text').val()") : '(' + old + ".child('text').exists() ? " + old + ".child('text').val() : '')") },
   createdAt: { '.validate': 'newData.isNumber() && newData.val() === ' + (i === 0 ? 'now' : '(' + old + ".child('createdAt').exists() ? " + old + ".child('createdAt').val() : 0)") },
   '$other': { '.validate': false },
  }
 }
 community.rates.$uid = {
  '.read': 'auth != null && auth.uid === $uid',
  '.write': 'auth != null && auth.uid === $uid && newData.exists()',
  '.validate': checks.join(' && '), seq: {}, createdAt: {}, recent, '$other': { '.validate': false },
 }
 return rules
}
