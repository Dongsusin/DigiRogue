// The same canvas is used by the live WebGL sprite and the visual inspection page.
export function createDamageTextCanvas(feedback) {
  const canvas = document.createElement('canvas')
  const g = canvas.getContext('2d')
  const numberFont = '900 96px "Arial Black", "Segoe UI", sans-serif'
  const badgeFont = '800 34px "Malgun Gothic", "Noto Sans KR", sans-serif'
  const criticalFont = '900 36px "Malgun Gothic", "Noto Sans KR", sans-serif'
  g.font = numberFont
  const numberWidth = g.measureText(feedback.text).width
  g.font = badgeFont
  const badgeWidth = g.measureText(feedback.label).width + 34
  g.font = criticalFont
  const criticalWidth = feedback.isCritical ? g.measureText(feedback.criticalLabel).width + 48 : 0
  canvas.width = Math.ceil(Math.max(numberWidth + 64, badgeWidth + 26, criticalWidth + 26))
  canvas.height = feedback.isCritical ? 232 : 184
  const x = canvas.width / 2, numberY = feedback.isCritical ? 113 : 65
  const color = `#${feedback.color.toString(16).padStart(6, '0')}`
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'

  // Critical hits keep the matchup's number color, with a separate gold crest.
  if (feedback.isCritical) {
    g.fillStyle = '#ffd67518'; g.strokeStyle = '#ffcb6880'; g.lineWidth = 2
    g.beginPath()
    for (let i = 0; i < 20; i++) {
      const angle = i * Math.PI / 10, radius = i % 2 ? 0.64 : 1
      const px = x + Math.cos(angle) * (canvas.width / 2 - 6) * radius
      const py = numberY + Math.sin(angle) * 67 * radius
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py)
    }
    g.closePath(); g.fill(); g.stroke()
    g.fillStyle = '#382408'; g.strokeStyle = '#ffd878'; g.lineWidth = 2
    g.beginPath(); g.roundRect(x - criticalWidth / 2, 4, criticalWidth, 46, 8); g.fill(); g.stroke()
    g.font = criticalFont; g.fillStyle = '#ffe6a0'; g.fillText(feedback.criticalLabel, x, 27)
    for (const side of [-1, 1]) {
      const cx = x + side * (criticalWidth / 2 - 13)
      g.beginPath(); g.moveTo(cx, 20); g.lineTo(cx + 4, 27); g.lineTo(cx, 34); g.lineTo(cx - 4, 27); g.closePath(); g.fill()
    }
  }

  g.font = numberFont; g.lineWidth = 16; g.strokeStyle = '#07101e'
  g.shadowColor = '#020611'; g.shadowBlur = 9; g.shadowOffsetY = 4
  g.strokeText(feedback.text, x, numberY)
  g.shadowBlur = 0; g.shadowOffsetY = 0
  const fill = g.createLinearGradient(0, numberY - 44, 0, numberY + 46)
  fill.addColorStop(0, '#ffffff'); fill.addColorStop(0.5, color); fill.addColorStop(1, color)
  g.fillStyle = fill; g.fillText(feedback.text, x, numberY)

  const badgeY = canvas.height - 56
  g.fillStyle = '#071221eb'; g.strokeStyle = color; g.lineWidth = 2
  g.beginPath(); g.roundRect(x - badgeWidth / 2, badgeY, badgeWidth, 44, 7); g.fill(); g.stroke()
  g.fillStyle = color; g.font = badgeFont; g.fillText(feedback.label, x, badgeY + 22)
  return canvas
}
