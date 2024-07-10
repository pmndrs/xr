import { BufferAttribute, BufferGeometry } from 'three'

export function updateXRMeshGeometry(
  mesh: XRMesh,
  geometry: (BufferGeometry & { createdAt?: number }) | undefined,
): BufferGeometry & { creationTime?: number } {
  if (geometry != null && geometry.createdAt != null && geometry.createdAt >= mesh.lastChangedTime) {
    return geometry
  }
  const newGeometry = new BufferGeometry()
  newGeometry.setIndex(new BufferAttribute(mesh.indices, 1))
  newGeometry.setAttribute('position', new BufferAttribute(mesh.vertices, 3))
  return Object.assign(newGeometry, { creationTime: mesh.lastChangedTime })
}
