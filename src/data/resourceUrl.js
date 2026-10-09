import versions from './resourceVersions.json' with { type: 'json' }

// Source URLs and saved music preferences remain stable. Only download URLs
// carry a content revision; modern browsers decode the explicit Brotli response.
export function versionedResourceUrl(url, { compressedModels = import.meta.env?.DEV !== true } = {}) {
  if (typeof url !== 'string') return url
  const fragmentAt = url.indexOf('#')
  const fragment = fragmentAt < 0 ? '' : url.slice(fragmentAt)
  const base = fragmentAt < 0 ? url : url.slice(0, fragmentAt)
  const queryAt = base.indexOf('?')
  const path = queryAt < 0 ? base : base.slice(0, queryAt)
  if (!Object.hasOwn(versions, path)) return url
  const query = new URLSearchParams(queryAt < 0 ? '' : base.slice(queryAt + 1))
  query.set('v', versions[path])
  return path + (compressedModels && path.endsWith('.glb') ? '.br' : '') + '?' + query + fragment
}
