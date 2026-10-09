import { DIGIMON_STAGE_DATA } from './digimonRoster.js'

// Event observations also refer to species by name, outside the current enemy party.
export const DIGIMON_TRAINING_TRAITS = Object.freeze(Object.fromEntries(Object.entries(DIGIMON_STAGE_DATA)
.flatMap(([stage, species]) => species.map(data => [data.이름,
  Object.freeze({ stage, attribute: data.속성, type: data.타입 })]))))
