import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { getRenderPixelRatio } from './renderResolution.js'

// Glow is blurred and composited over the full-resolution scene. Limiting only
// these five blur levels keeps the Digimon sharp while reducing GPU fill cost.
export class CinematicBloomPass extends UnrealBloomPass {
  setSize(width, height) {
    const ratio = getRenderPixelRatio(width, height, 1, 1, 800_000)
    super.setSize(Math.max(2, 2 * Math.floor(width * ratio / 2)), Math.max(2, 2 * Math.floor(height * ratio / 2)))
  }
}
