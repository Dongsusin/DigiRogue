const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max))

// DOM rectangles are physical pixels; every popover shares the game's logical canvas.
export function toLocalRect(rect, frame, width, height) {
  const scaleX = frame.width / width || 1
  const scaleY = frame.height / height || 1
  const left = (rect.left - frame.left) / scaleX
  const top = (rect.top - frame.top) / scaleY
  return { left, top, width: rect.width / scaleX, height: rect.height / scaleY,
    right: left + rect.width / scaleX, bottom: top + rect.height / scaleY }
}

export function placePopover(anchor, bounds, size, preferred = 'bottom', gap = 12) {
  const width = Math.min(size.width, bounds.right - bounds.left)
  const availableHeight = bounds.bottom - bounds.top
  const right = bounds.right - anchor.right - gap
  const left = anchor.left - gap - bounds.left
  let placement = preferred
  let maxHeight = availableHeight
  let x
  let y

  if (preferred === 'side' && Math.max(left, right) >= width) {
    placement = right >= width ? 'right' : 'left'
    x = placement === 'right' ? anchor.right + gap : anchor.left - gap - width
    y = anchor.top + (anchor.height - Math.min(size.height, maxHeight)) / 2
  } else {
    const below = Math.max(0, bounds.bottom - Math.max(bounds.top, anchor.bottom + gap))
    const above = Math.max(0, Math.min(bounds.bottom, anchor.top - gap) - bounds.top)
    placement = below >= size.height || (above < size.height && below >= above) ? 'bottom' : 'top'
    maxHeight = Math.max(1, placement === 'bottom' ? below : above)
    x = anchor.left + (anchor.width - width) / 2
    y = placement === 'bottom' ? anchor.bottom + gap : anchor.top - gap - Math.min(size.height, maxHeight)
  }
  const height = Math.min(size.height, maxHeight)
  return { x: clamp(x, bounds.left, bounds.right - width),
    y: clamp(y, bounds.top, bounds.bottom - height), width, height, maxHeight, placement }
}
