function collect(trees) {
  const geometries = new Set(), materials = new Set(), textures = new Set(), skeletons = new Set()
  for (const tree of trees) tree.traverse(node => {
    if (node.geometry) geometries.add(node.geometry)
    if (node.skeleton) skeletons.add(node.skeleton)
    for (const material of [].concat(node.material ?? [])) {
      materials.add(material)
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value)
    }
  })
  return { geometries, materials, textures, skeletons }
}

// Cutscene clones own their skeleton/material/effects. Template buffers and
// image bitmaps belong to the shared cache, and survive until its last lease.
export function disposeModelTrees(trees, { preserve = [], closeImages = false } = {}) {
  const owned = collect(trees), shared = collect(preserve)
  for (const kind of Object.keys(owned)) for (const value of owned[kind]) {
    if (!shared[kind].has(value)) value.dispose()
  }
  if (closeImages) {
    const images = new Set([...owned.textures].filter(texture => !shared.textures.has(texture))
      .map(texture => texture.source?.data).filter(image => image?.close))
    images.forEach(image => image.close())
  }
}
