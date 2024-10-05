import { BufferAttribute, Matrix4, Mesh, Object3D, Triangle, Vector2, Vector3 } from 'three'
import { PointerEventsMap } from './event.js'
import type { Root } from '@react-three/fiber/dist/declarations/src/core/renderer.js'

declare module 'three' {
  interface Object3D {
    __r3f?: {
      eventCount: number
      handlers: Record<string, ((e: any) => void) | undefined>
      root: Root['store']
    }
    /**
     * undefined and true means the transformation is ready
     * false means transformation is not ready
     */
    transformReady?: boolean
  }
}

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

export function hasObjectListeners({ _listeners, __r3f }: Object3D): boolean {
  if (__r3f != null && __r3f?.eventCount > 0) {
    return true
  }
  if (_listeners == null) {
    return false
  }
  const entries = Object.entries(_listeners)
  const length = entries.length
  for (let i = 0; i < length; i++) {
    const entry = entries[i]
    if (!listenerNames.includes(entry[0])) {
      continue
    }
    if (entry[1] != null && entry[1].length > 0) {
      return true
    }
  }
  return false
}

export function getObjectListeners<E>(
  object: Object3D,
  forEvent: keyof PointerEventsMap,
): Array<(event: E) => void> | undefined {
  if (object._listeners != null && forEvent in object._listeners) {
    return object._listeners[forEvent]
  }

  //R3F compatibility
  let handler: ((e: any) => void) | undefined
  if (object.isVoidObject && forEvent === 'click' && object.parent?.__r3f != null) {
    handler = object.parent.__r3f.root.getState().onPointerMissed
  }
  if (object.__r3f != null) {
    handler = object.__r3f.handlers[r3fEventToHandlerMap[forEvent]]
  }

  if (handler == null) {
    return undefined
  }
  return [handler]
}

const r3fEventToHandlerMap: Record<keyof PointerEventsMap, string> = {
  click: 'onClick',
  contextmenu: 'onContextMenu',
  dblclick: 'onDoubleClick',
  pointercancel: 'onPointerCancel',
  pointerdown: 'onPointerDown',
  pointerenter: 'onPointerEnter',
  pointerleave: 'onPointerLeave',
  pointermove: 'onPointerMove',
  pointerout: 'onPointerOut',
  pointerover: 'onPointerOver',
  pointerup: 'onPointerUp',
  wheel: 'onWheel',
}
const listenerNames = Object.keys(r3fEventToHandlerMap)

const triangleHelper1 = new Triangle()
const triangleHelper2 = new Triangle()
const aVec2Helper = new Vector2()
const bVec2Helper = new Vector2()
const cVec2Helper = new Vector2()
const pointHelper = new Vector3()
const inverseMatrix = new Matrix4()
const localPointHelper = new Vector3()

export function getClosestUV(target: Vector2, point: Vector3, mesh: Mesh): void {
  localPointHelper.copy(point).applyMatrix4(inverseMatrix.copy(mesh.matrixWorld).invert())
  const uv = mesh.geometry.attributes.uv
  if (uv == null || !(uv instanceof BufferAttribute)) {
    return void target.set(0, 0)
  }
  let clostestDistance: number | undefined
  loopThroughTriangles(mesh, (i1, i2, i3) => {
    mesh.getVertexPosition(i1, triangleHelper1.a)
    mesh.getVertexPosition(i2, triangleHelper1.b)
    mesh.getVertexPosition(i3, triangleHelper1.c)

    const distance = triangleHelper1.closestPointToPoint(localPointHelper, pointHelper).distanceTo(localPointHelper)

    if (clostestDistance != null && distance >= clostestDistance) {
      return void target.set(0, 0)
    }

    clostestDistance = distance
    triangleHelper2.copy(triangleHelper1)
    aVec2Helper.fromBufferAttribute(uv, i1)
    bVec2Helper.fromBufferAttribute(uv, i2)
    cVec2Helper.fromBufferAttribute(uv, i3)
  })

  if (clostestDistance == null) {
    return void target.set(0, 0)
  }

  triangleHelper2.closestPointToPoint(localPointHelper, pointHelper)

  triangleHelper2.getInterpolation(pointHelper, aVec2Helper, bVec2Helper, cVec2Helper, target)
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
