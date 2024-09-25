import { Object3D, Intersection as ThreeIntersection } from 'three'
import { Intersection } from '../index.js'
import { PointerCapture } from '../pointer.js'

export abstract class Intersector {
  //state of the current intersection
  protected intersection: ThreeIntersection | undefined
  protected pointerEventsOrder: number | undefined

  public startIntersection(nativeEvent: unknown): void {
    this.intersection = undefined
    this.pointerEventsOrder = undefined
    this.prepareIntersection(nativeEvent)
  }

  public abstract intersectPointerCapture(
    pointerCapture: PointerCapture,
    nativeEvent: unknown,
  ): Intersection | undefined

  public abstract isReady(): boolean

  protected abstract prepareIntersection(nativeEvent: unknown): void

  public abstract executeIntersection(object: Object3D, objectPointerEventsOrder: number): void

  public abstract finalizeIntersection(): Intersection | undefined
}
