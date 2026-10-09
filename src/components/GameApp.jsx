import { lazy } from 'react'
import { loadGameModule } from '../loading/gameModule.js'

// Keep the game catalog separate from the small entry screen and the 3D engine.
const GameApp = lazy(loadGameModule)
export default GameApp
