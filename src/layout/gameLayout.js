export const GAME_WIDTH = 1280
export const GAME_HEIGHT = 720
export function fitGameFrame(width, height) {
  const scale = Math.min(Math.max(1, Math.floor(width)) / GAME_WIDTH, Math.max(1, Math.floor(height)) / GAME_HEIGHT)
  return { scale, width: GAME_WIDTH * scale, height: GAME_HEIGHT * scale }
}
export function blocksPortrait(width, height, touch = false) {
  return height > width && (touch || width <= 900)
}