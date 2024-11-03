import { BufferAttribute, Matrix4, Mesh, Object3D, Triangle, Vector2, Vector3 } from 'three'
import { PointerEventsMap } from './event.js'

export function updateAndCheckWorldTransformation({ transformReady, parent, matrix, matrixWorld }: Object3D): boolean {
  if (transformReady === false) {
    return false
  }
  if (parent == null) {
    return true
  }
  if (!updateAndCheckWorldTransformation(parent)) {
    return false
  }
  matrixWorld.multiplyMatrices(parent.matrixWorld, matrix)
  return true
}

const triangleHelper1 = new Triangle()
const triangleHelper2 = new Triangle()
const aVec2Helper = new Vector2()
const bVec2Helper = new Vector2()
const cVec2Helper = new Vector2()
const pointHelper = new Vector3()
const inverseMatrix = new Matrix4()
const localPointHelper = new Vector3()

export function getClosestUV(target: Vector2, point: Vector3, mesh: Mesh): boolean {
  localPointHelper.copy(point).applyMatrix4(inverseMatrix.copy(mesh.matrixWorld).invert())
  const uv = mesh.geometry.attributes.uv
  if (uv == null || !(uv instanceof BufferAttribute)) {
    return false
  }
  let clostestDistance: number | undefined
  loopThroughTriangles(mesh, (i1, i2, i3) => {
    mesh.getVertexPosition(i1, triangleHelper1.a)
    mesh.getVertexPosition(i2, triangleHelper1.b)
    mesh.getVertexPosition(i3, triangleHelper1.c)

    const distance = triangleHelper1.closestPointToPoint(localPointHelper, pointHelper).distanceTo(localPointHelper)

    if (clostestDistance != null && distance >= clostestDistance) {
      return
    }

    clostestDistance = distance
    triangleHelper2.copy(triangleHelper1)
    aVec2Helper.fromBufferAttribute(uv, i1)
    bVec2Helper.fromBufferAttribute(uv, i2)
    cVec2Helper.fromBufferAttribute(uv, i3)
  })

  if (clostestDistance == null) {
    return false
  }

  triangleHelper2.closestPointToPoint(localPointHelper, pointHelper)

  triangleHelper2.getInterpolation(pointHelper, aVec2Helper, bVec2Helper, cVec2Helper, target)

  return true
}

function loopThroughTriangles(mesh: Mesh, fn: (i1: number, i2: number, i3: number) => void) {
  const drawRange = mesh.geometry.drawRange
  if (mesh.geometry.index != null) {
    const index = mesh.geometry.index
    const start = Math.max(0, drawRange.start)
    const end = Math.min(index.count, drawRange.start + drawRange.count)
    for (let i = start; i < end; i += 3) {
      fn(index.getX(i), index.getX(i + 1), index.getX(i + 2))
    }
    return
  }
  const position = mesh.geometry.attributes.position

  if (position == null) {
    return
  }

  const start = Math.max(0, drawRange.start)
  const end = Math.min(position.count, drawRange.start + drawRange.count)

  for (let i = start; i < end; i += 3) {
    fn(i, i + 1, i + 2)
  }
}
