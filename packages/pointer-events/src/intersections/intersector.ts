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

export abstract class Intersector {
  //state of the current intersection
  protected intersection: ThreeIntersection | undefined
  protected pointerEventsOrder: number | undefined

  public startIntersection(nativeEvent: unknown): void {
    this.intersection = undefined
    this.pointerEventsOrder = undefined
    this.prepareIntersection(nativeEvent)
  }

  public abstract intersectPointerCapture(pointerCapture: PointerCapture, nativeEvent: unknown): Intersection

  public abstract isReady(): boolean

  protected abstract prepareIntersection(nativeEvent: unknown): void

  public abstract executeIntersection(scene: Object3D, objectPointerEventsOrder: number): void

  public abstract finalizeIntersection(scene: Object3D): Intersection
}
