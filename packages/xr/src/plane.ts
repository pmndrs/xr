import { Box2, BufferGeometry, Shape, ShapeGeometry, Vector2 } from 'three'

declare global {
  type XRSemanticLabel = 'desk' | 'couch' | 'floor' | 'ceiling' | 'wall' | 'door' | 'window' | 'other' | string
  interface XRPlane {
    semanticLabel?: XRSemanticLabel
  }
  interface XRMesh {
    semanticLabel?: XRSemanticLabel
  }
}

export function updateXRPlaneGeometry(
  plane: XRPlane,
  geometry: (BufferGeometry & { createdAt?: number }) | undefined,
): BufferGeometry & { createdAt?: number } {
  if (geometry != null && geometry.createdAt != null && geometry.createdAt >= plane.lastChangedTime) {
    return geometry
  }
  return Object.assign(createGeometryFromPolygon(plane.polygon), { createdAt: plane.lastChangedTime })
}

const boxHelper = new Box2()
const sizeHelper = new Vector2()

function createGeometryFromPolygon(polygon: DOMPointReadOnly[]): BufferGeometry {
  const shape = new Shape()
  const points = polygon.map(({ x, z }) => new Vector2(x, z))
  //we measure the size and scale & unscale to have normalized UVs for the geometry
  boxHelper.setFromPoints(points)
  boxHelper.getSize(sizeHelper)
  for (const point of points) {
    point.sub(boxHelper.min)
    point.divide(sizeHelper)
  }
  shape.setFromPoints(points)
  const geometry = new ShapeGeometry(shape)
  geometry.scale(sizeHelper.x, sizeHelper.y, 1)
  geometry.translate(boxHelper.min.x, boxHelper.min.y, 0)
  geometry.rotateX(Math.PI / 2)
  return geometry
}
