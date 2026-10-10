// Bundle the real module-level battle functions for Node tests. No test API is
// exposed by the shipped game, and the temporary bundle lives outside the repo.
import { build } from 'vite'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, dirname, basename } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export async function loadBattleEngine({ difficultySource } = {}) {
  const root = resolve(fileURLToPath(new URL('../../', import.meta.url))).replaceAll('\\', '/')
  const directory = await mkdtemp(join(tmpdir(), 'digilog-balance-'))
  const names = ['mapData','allDigimonLookup','allSkillLookup','getSkillData','createCombatant','refreshCombatantStats',
    'buildStartingParty','buildEnemyParty','getEncounterGroupForStage','getMapEncounterGroups','getBossEncounterNamesForStage',
    'getEncounterCountForStage','getRandomConnectedMapName','getConnectedMapNames','getMapNameForStage','getLevelCapForStage','getEvolutionOptions','createEvolvedCombatant',
    'resolveBattleTurnActions','createBattleTurnAction','createEnemyBattleTurnActions','getBattleAllyLimit',
    'getCommandSkillNames','scoreSkill','getMatchupResult','recoverAfterVictory','applyPartyExperienceGain',
    'levelUpCombatant','parseSavedGameState','applySupportEffectToTarget','resolveTurnEndCombatantEffects',
    'evolveBossCombatant','createReturnedEvolutionCombatant','createJogressCombatant','resolveJogressEvolution','resolveManualEvolution','resolveJogressSkillChoice','getPendingJogressSkillEvents',
    'getNewSkillLearnNamesForLevel','getSkillLearnEventsForLevelRange','applyExperienceAmount',
    'createRewardSelection','applyInstantRewardEffect','applyPartyHealRewardEffect','applyDigicloneRewardEffect',
    'applyLevelUpRewardEffect','getEvolutionRoute','isBossStage','getStageClearGoldReward','isRewardItemUsableByCombatant',
    'addRewardInventoryItem','applyMapEnvironment','prepareCombatantForStage','fixedRewardItems']
  const entry = join(directory, 'entry.mjs')
  await writeFile(entry, 'export {' + names.join(',') + '} from ' + JSON.stringify(root + '/src/App.jsx'))
  await build({ configFile: false, root, publicDir: false, logLevel: 'silent',
    plugins: [{ name: 'battle-test-exports', enforce: 'pre', transform(code, id) {
      if (difficultySource && id.replaceAll('\\', '/') === root + '/src/progression/gameDifficulty.js') return difficultySource
      if (id.replaceAll('\\', '/') !== root + '/src/App.jsx') return null
      return code.slice(0, code.indexOf('function App()')) + '\nexport {' + names.join(',') + '}\n'
    } }], build: { outDir: join(directory, 'bundle'), emptyOutDir: false, minify: false,
      lib: { entry, formats: ['es'], fileName: 'engine' }, rolldownOptions: { output: { codeSplitting: false } } },
  })
  try {
    return await import(pathToFileURL(join(directory, 'bundle', 'engine.js')).href)
  } finally {
    // Only this freshly-created test bundle is removed.
    const target = resolve(directory)
    if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith('digilog-balance-')) throw new Error('Unexpected test bundle path')
    await rm(target, { recursive: true, force: true })
  }
}
