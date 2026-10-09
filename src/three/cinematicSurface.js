import { Color, Vector2, WebGLRenderer } from 'three'

let battle = null
export function registerBattleSurface(owner) {
  battle = owner
  return () => { if (battle === owner) battle = null }
}

// An opaque cutscene borrows the suspended battle's canvas/context. Geometry,
// textures and existing shader programs then stay on the GPU between scenes.
// Gallery/standalone previews still own and release their separate context.
export function acquireCinematicSurface(host, options, create = settings => new WebGLRenderer(settings)) {
  const owner = battle?.paused && !battle.borrowed && !battle.disposed && !battle.failed ? battle : null
  const renderer = owner?.renderer ?? create(options)
  let snapshot
  if (owner) {
    snapshot = { parent: renderer.domElement.parentElement, size: renderer.getSize(new Vector2()), ratio: renderer.getPixelRatio(),
      color: renderer.getClearColor(new Color()), alpha: renderer.getClearAlpha(), exposure: renderer.toneMappingExposure,
      toneMapping: renderer.toneMapping, colorSpace: renderer.outputColorSpace, clipping: renderer.localClippingEnabled,
      autoClear: renderer.autoClear }
    owner.borrowed = true; owner.syncFrameLoop()
  }
  renderer.localClippingEnabled = false
  renderer.setClearColor(0x000000, options.alpha ? 0 : 1)
  host.appendChild(renderer.domElement)
  let disposed = false
  return { renderer, borrowed: Boolean(owner), dispose() {
    if (disposed) return
    disposed = true
    if (!owner) { renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); return }
    owner.borrowed = false
    if (owner.disposed) { renderer.domElement.remove(); return }
    renderer.setRenderTarget(null)
    renderer.setClearColor(snapshot.color, snapshot.alpha)
    renderer.localClippingEnabled = snapshot.clipping
    renderer.outputColorSpace = snapshot.colorSpace; renderer.toneMapping = snapshot.toneMapping
    renderer.toneMappingExposure = snapshot.exposure; renderer.autoClear = snapshot.autoClear
    renderer.setPixelRatio(snapshot.ratio); renderer.setSize(snapshot.size.x, snapshot.size.y, false)
    snapshot.parent.appendChild(renderer.domElement)
    renderer.clear(); owner.layoutDirty = true; owner.syncFrameLoop()
  } }
}
