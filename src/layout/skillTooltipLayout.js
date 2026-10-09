import { toLocalRect } from './popoverLayout.js'

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max))

// Pointer coordinates and the tooltip must use the same scaled, letterboxed canvas.
export function localSkillPointer(point, frame, width, height) {
  const rect = toLocalRect({ left: point.x, top: point.y, width: 0, height: 0 }, frame, width, height)
  return { x: rect.left, y: rect.top }
}

export function placeSkillTooltip(point, bounds, size, gap = 18) {
  const width = Math.min(size.width, bounds.right - bounds.left)
  const maxHeight = bounds.bottom - bounds.top
  const height = Math.min(size.height, maxHeight)
  const fitsRight = point.x + gap + width <= bounds.right
  const x = fitsRight ? point.x + gap : point.x - gap - width
  const fitsBelow = point.y + gap + height <= bounds.bottom
  const y = fitsBelow ? point.y + gap : point.y - gap - height
  return { x: clamp(x, bounds.left, bounds.right - width), y: clamp(y, bounds.top, bounds.bottom - height),
    width, height, maxHeight, placement: fitsRight ? 'right' : 'left' }
}
