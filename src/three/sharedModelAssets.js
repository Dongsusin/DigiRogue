import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { ResourceLeaseCache } from './ResourceLeaseCache.js'
import { disposeModelTrees } from './modelResources.js'
import { versionedResourceUrl } from '../data/resourceUrl.js'

function decodedBytes(asset) {
  const buffers = new Set(), images = new Set()
  asset.scene.traverse(node => {
    for (const attribute of [...Object.values(node.geometry?.attributes ?? {}), node.geometry?.index]) {
      const buffer = attribute?.array?.buffer ?? attribute?.data?.array?.buffer
      if (buffer) buffers.add(buffer)
    }
    for (const material of [].concat(node.material ?? [])) for (const value of Object.values(material)) {
      if (value?.isTexture && value.source?.data) images.add(value.source.data)
    }
  })
  for (const clip of asset.animations ?? []) for (const track of clip.tracks) {
    buffers.add(track.times.buffer); buffers.add(track.values.buffer)
  }
  return [...buffers].reduce((bytes, buffer) => bytes + buffer.byteLength, 0) +
    [...images].reduce((bytes, image) => bytes + (image.width || 0) * (image.height || 0) * 4, 0)
}

const templates = new ResourceLeaseCache({
  load: url => new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(versionedResourceUrl(url)),
  dispose: asset => disposeModelTrees([asset.scene], { closeImages: true }),
  estimate: decodedBytes, limit: 6, maxBytes: 96 * 1024 * 1024,
})

export const acquireModelAsset = url => templates.acquire(url)
export const releaseUnusedModels = () => templates.trim({ all: true })
if (import.meta.hot) import.meta.hot.dispose(releaseUnusedModels)
