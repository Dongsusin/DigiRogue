import { useEffect, useRef, useState } from 'react'
import { getSkillDropTarget } from '../battle/skillOrder.js'
import { localSkillPointer } from '../layout/skillTooltipLayout.js'

export default function useSkillReorderDrag({ rootRef, names, enabled, onStart, onReorder }) {
  const gestureRef = useRef(null)
  const frameRef = useRef(0)
  const suppressClickRef = useRef(false)
  const [drag, setDrag] = useState(null)

  const clear = () => {
    const gesture = gestureRef.current
    gestureRef.current = null
    cancelAnimationFrame(frameRef.current)
    frameRef.current = 0
    if (gesture?.anchor.hasPointerCapture(gesture.pointerId)) gesture.anchor.releasePointerCapture(gesture.pointerId)
    setDrag(null)
    return gesture
  }
  const cancel = () => {
    const gesture = clear()
    if (gesture?.active) suppressClickRef.current = true
    return Boolean(gesture)
  }
  const targetAt = (gesture) => {
    const list = rootRef.current?.querySelector('[aria-label="기술 목록"]')
    if (!list) return null
    const rows = [...list.querySelectorAll('[data-reorder-name]')]
    return getSkillDropTarget(rows.map(row => row.getBoundingClientRect()), list.getBoundingClientRect(),
      gesture.point, rows.findIndex(row => row.dataset.reorderName === gesture.name))
  }
  const update = (time) => {
    const gesture = gestureRef.current
    const root = rootRef.current
    if (!gesture?.active || !root) return
    const list = root.querySelector('[aria-label="기술 목록"]')
    if (!list) { cancel(); return }
    const bounds = list.getBoundingClientRect()
    const { x, y } = gesture.point
    const elapsed = Math.min(32, time - (gesture.time ?? time))
    gesture.time = time
    if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
      const edge = Math.min(36, bounds.height / 4)
      const speed = y < bounds.top + edge ? -1 : y > bounds.bottom - edge ? 1 : 0
      list.scrollTop += speed * elapsed * 0.5
    }
    const target = targetAt(gesture)
    const point = localSkillPointer(gesture.point, root.getBoundingClientRect(), root.offsetWidth, root.offsetHeight)
    const next = { name: gesture.name, slot: target?.slot, x: Math.max(8, Math.min(point.x, root.offsetWidth - 230)), y: Math.max(42, point.y) }
    setDrag(previous => previous?.name === next.name && previous.slot === next.slot &&
      previous.x === next.x && previous.y === next.y ? previous : next)
    frameRef.current = requestAnimationFrame(update)
  }

  useEffect(() => {
    const blur = () => cancel()
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('blur', blur)
      const gesture = gestureRef.current
      gestureRef.current = null
      cancelAnimationFrame(frameRef.current)
      if (gesture?.anchor.hasPointerCapture(gesture.pointerId)) gesture.anchor.releasePointerCapture(gesture.pointerId)
    }
  }, [enabled, names.join('\u0000')])

  const handlers = (name) => ({
    onPointerDown: event => {
      if (event.button !== 0) return
      suppressClickRef.current = false
      if (!enabled || !names.includes(name) || names.length < 2 || gestureRef.current) return
      gestureRef.current = { name, pointerId: event.pointerId, anchor: event.currentTarget,
        start: { x: event.clientX, y: event.clientY }, point: { x: event.clientX, y: event.clientY }, active: false }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    onPointerMove: event => {
      const gesture = gestureRef.current
      if (!gesture || event.pointerId !== gesture.pointerId) return
      gesture.point = { x: event.clientX, y: event.clientY }
      if (!gesture.active && Math.hypot(event.clientX - gesture.start.x, event.clientY - gesture.start.y) >= 6) {
        gesture.active = true
        onStart()
        frameRef.current = requestAnimationFrame(update)
      }
      if (gesture.active) event.preventDefault()
    },
    onPointerUp: event => {
      const gesture = gestureRef.current
      if (!gesture || event.pointerId !== gesture.pointerId) return
      gesture.point = { x: event.clientX, y: event.clientY }
      const target = gesture.active ? targetAt(gesture) : null
      suppressClickRef.current = gesture.active
      clear()
      if (target) onReorder(gesture.name, target.index)
    },
    onPointerCancel: cancel,
    onLostPointerCapture: cancel,
  })
  return { drag, handlers, cancel, isDragging: () => Boolean(gestureRef.current?.active),
    suppressClick: event => {
      if (event.detail === 0) return false
      const suppress = suppressClickRef.current
      suppressClickRef.current = false
      return suppress
    } }
}
