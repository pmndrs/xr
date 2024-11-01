import { Mesh, Object3D, Sphere, SphereGeometry, Intersection as ThreeIntersection } from 'three'
import { Intersection } from '../index.js'
import { PointerCapture } from '../pointer.js'

const VoidObjectRadius = 1000000
export const VoidObjectCollider = new Sphere(undefined, VoidObjectRadius)
const VoidObjectGeometry = new SphereGeometry(VoidObjectRadius)

const sceneVoidObjectMap = new Map<Object3D, Object3D>()

export function getVoidObject(scene: Object3D): Object3D {
  let entry = sceneVoidObjectMap.get(scene)
  if (entry == null) {
    entry = new Mesh(VoidObjectGeometry)
    entry.isVoidObject = true
    entry.parent = scene
    //makes sure all other intersections are always prioritized
    entry.pointerEventsOrder = -Infinity
    sceneVoidObjectMap.set(scene, entry)
  }
  return entry
}

export interface Intersector {
  intersectPointerCapture(pointerCapture: PointerCapture, nativeEvent: unknown): Intersection
  isReady(): boolean
  startIntersection(nativeEvent: unknown): void
  executeIntersection(scene: Object3D, objectPointerEventsOrder: number): void
  finalizeIntersection(scene: Object3D): Intersection
}
