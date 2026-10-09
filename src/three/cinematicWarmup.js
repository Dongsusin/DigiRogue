import { ACESFilmicToneMapping, Mesh, OrthographicCamera, PlaneGeometry, Scene, SRGBColorSpace } from 'three'

// Compile while the loading portrait is visible. KHR_parallel_shader_compile
// lets the driver work without a multi-second stall on the first animation frame.
export async function warmCinematicRenderer(renderer, scene, camera, composer, isDisposed, models = scene) {
  if (!renderer.compileAsync || isDisposed()) return
  const previousTarget = renderer.getRenderTarget()
  // Scene shaders must match the linear render target used by RenderPass.
  // Compiling them for the screen would compile a second variant on frame 1.
  if (composer) renderer.setRenderTarget(composer.readBuffer)
  const roots = [].concat(models)
  try { for (const root of roots) { if (isDisposed()) return; await renderer.compileAsync(root, camera, scene) } }
  finally { if (!isDisposed()) renderer.setRenderTarget(previousTarget) }
  if (isDisposed()) return
  const textures = new Set()
  for (const root of roots) root.traverse(object => {
    for (const material of [].concat(object.material ?? [])) for (const value of Object.values(material)) {
      if (value?.isTexture) textures.add(value)
    }
  })
  for (const texture of textures) {
    if (isDisposed()) return
    renderer.initTexture?.(texture)
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  if (isDisposed() || !composer) return
  const materials = new Set(), outputMaterials = new Set()
  for (const pass of composer.passes) {
    for (const value of Object.values(pass)) {
      if (value?.isShaderMaterial) materials.add(value)
      if (Array.isArray(value)) value.forEach(material => { if (material?.isShaderMaterial) materials.add(material) })
    }
    if (pass.uniforms?.toneMappingExposure && pass.material) {
      // OutputPass chooses these defines when it first renders. Set the same
      // public material defines now so its final screen shader is already warm.
      pass.material.defines = {}
      if (renderer.outputColorSpace === SRGBColorSpace) pass.material.defines.SRGB_TRANSFER = ''
      if (renderer.toneMapping === ACESFilmicToneMapping) pass.material.defines.ACES_FILMIC_TONE_MAPPING = ''
      pass.material.needsUpdate = true
      outputMaterials.add(pass.material); materials.delete(pass.material)
    }
  }
  const quadScene = new Scene(), geometry = new PlaneGeometry(2, 2)
  for (const material of materials) quadScene.add(new Mesh(geometry, material))
  const quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  try {
    renderer.setRenderTarget(composer.readBuffer)
    await renderer.compileAsync(quadScene, quadCamera)
    if (isDisposed()) return
    quadScene.clear()
    for (const material of outputMaterials) quadScene.add(new Mesh(geometry, material))
    renderer.setRenderTarget(null)
    await renderer.compileAsync(quadScene, quadCamera)
  } finally { geometry.dispose(); if (!isDisposed()) renderer.setRenderTarget(previousTarget) }
}

// Remaining effect shaders compile during the quiet intro. They do not delay
// the ready state or force a healthy cutscene into its network-error fallback.
export function warmCinematicEffects(renderer, scene, camera, composer, isDisposed) {
  setTimeout(() => {
    if (isDisposed() || !renderer.compileAsync) return
    const previousTarget = renderer.getRenderTarget()
    if (composer) renderer.setRenderTarget(composer.readBuffer)
    try { renderer.compileAsync(scene, camera).catch(() => {}) }
    catch { /* A warmup failure leaves the normal render/error path in charge. */ }
    finally { renderer.setRenderTarget(previousTarget) }
  }, 0)
}
