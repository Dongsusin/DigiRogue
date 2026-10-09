import { TRAINER_SKILLS } from '../progression/trainerSkills.js'

// Coordinates use the game's existing 1280 × 720 design canvas. Reserve space
// for two label lines, a rank, and the tile's focus ring before placing a row.
const groups = [
  ['budget', 4, 158], ['general', 4, 158], ['stage', 7, 84],
  ['attribute', 6, 84], ['type', 6, 84], ['specialty', 3, 210],
]
const rowPitch = 120
const sectionGap = 156

export function layoutTrainerSkills(category, tab, skills = TRAINER_SKILLS) {
  const nodes = skills.filter(node => node.category === category && (!node.tab || node.tab === tab))
    .map(node => ({ ...node }))
  let firstRow = 94, lastRow = 94
  for (const [group, columns, spacing] of groups) {
    const members = nodes.filter(node => node.group === group)
    if (!members.length) continue
    members.forEach((node, index) => Object.assign(node, {
      x: 225 + (index % columns) * spacing,
      y: firstRow + Math.floor(index / columns) * rowPitch,
    }))
    lastRow = firstRow + (Math.ceil(members.length / columns) - 1) * rowPitch
    firstRow = lastRow + sectionGap
  }
  const height = Math.max(260, lastRow + 80)
  const root = nodes.find(node => node.group === 'root')
  if (root) Object.assign(root, { x: 74, y: Math.min(278, height / 2) })
  // Both tile sizes leave 51 px for the labels below the tile.
  for (const node of nodes) node.anchorY = node.y - 25.5
  return { nodes, width: 815, height }
}
