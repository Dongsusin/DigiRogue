// Keep normal desktop/mobile detail; bound full-screen GPU fill on high-DPI
// and 4K displays instead of blindly rendering every scene at 2x resolution.
export function getRenderPixelRatio(width, height, deviceRatio = 1, maxRatio = 1.5, maxPixels = 2_000_000) {
  const area = Math.max(1, Number(width) || 1) * Math.max(1, Number(height) || 1)
  const ratio = Number.isFinite(deviceRatio) && deviceRatio > 0 ? deviceRatio : 1
  return Math.min(ratio, maxRatio, Math.sqrt(maxPixels / area))
}
