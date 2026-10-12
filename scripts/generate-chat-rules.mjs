import { readFile, writeFile } from 'node:fs/promises'
import { applyChatRules } from './lib/chat-rules.mjs'
const file = new URL('../database.rules.json', import.meta.url)
const original = await readFile(file, 'utf8')
const result = JSON.stringify(applyChatRules(JSON.parse(original)), null, 2) + String.fromCharCode(10)
if (process.argv.includes('--check')) {
 if (JSON.stringify(JSON.parse(original)) !== JSON.stringify(JSON.parse(result))) throw new Error('Chat rules are stale. Run node scripts/generate-chat-rules.mjs')
 console.log('Chat rules match the shared moderation policy.')
} else { await writeFile(file, result); console.log('Updated chat rules; other database paths preserved.') }
