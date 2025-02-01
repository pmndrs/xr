import { Object3D } from 'three'
import { NativeEvent } from './event.js'
import { Pointer, PointerCapture } from './pointer.js'
import { intersectPointerEventTargets } from './intersections/utils.js'
import { Intersection } from './index.js'

export class CombinedPointer {
  private readonly pointers: Array<Pointer | CombinedPointer> = []
  private readonly isDefaults: Array<boolean> = []
  private enabled: boolean = true
  private activePointer: Pointer | CombinedPointer | undefined
  private readonly nonCapturedPointers: Array<Pointer> = []

  constructor(private readonly enableMultiplePointers: boolean) {}

  register(pointer: Pointer | CombinedPointer, isDefault: boolean = false): () => void {
    this.pointers.push(pointer)
    this.isDefaults.push(isDefault)
    return this.unregister.bind(this, pointer)
  }

  private unregister(pointer: Pointer | CombinedPointer) {
    const index = this.pointers.indexOf(pointer)
    if (index === -1) {
      return
    }
    this.isDefaults.splice(index, 1)
    this.pointers.splice(index, 1)
  }

  /**
   * @returns true if any pointer is captured
   */
  private startIntersection(nonCapturedPointers: Array<Pointer>, nativeEvent: NativeEvent): boolean {
    const length = this.pointers.length
    let anyPointerIsCaptured = false
    for (let i = 0; i < length; i++) {
      const pointer = this.pointers[i]
      if (pointer instanceof CombinedPointer) {
        pointer.startIntersection(nonCapturedPointers, nativeEvent)
        continue
      }
      const pointerCapture = pointer.getPointerCapture()
      if (pointerCapture != null) {
        anyPointerIsCaptured = true
        pointer.setIntersection(pointer.intersector.intersectPointerCapture(pointerCapture, nativeEvent))
        continue
      }
      nonCapturedPointers.push(pointer)
      pointer.intersector.startIntersection(nativeEvent)
    }
    return anyPointerIsCaptured
  }

  /**
   * only for internal use
   */
  getIntersection(): Intersection | undefined {
    return this.activePointer?.getIntersection()
  }

  /**
   * only for internal use
   */
  getPointerCapture(): PointerCapture | undefined {
    return this.activePointer?.getPointerCapture()
  }

  private computeActivePointer() {
    let smallestDistance: number | undefined
    this.activePointer = undefined
    const length = this.pointers.length
    for (let i = 0; i < length; i++) {
      const pointer = this.pointers[i]
      if (pointer instanceof CombinedPointer) {
        pointer.computeActivePointer()
      }
      const intersection = pointer.getIntersection()
      const distance =
        pointer.getPointerCapture() != null
          ? -Infinity
          : intersection?.object.isVoidObject
            ? Infinity
            : (intersection?.distance ?? Infinity)
      const isDefault = this.isDefaults[i]
      if (smallestDistance == null || (isDefault && distance === smallestDistance) || distance < smallestDistance) {
        this.activePointer = pointer
        smallestDistance = distance
      }
    }
  }

  /**
   * only for internal use
   */
  commit(nativeEvent: NativeEvent, emitMove: boolean, computeActivePointer: boolean = true): void {
    if (this.enableMultiplePointers) {
      const length = this.pointers.length
      for (let i = 0; i < length; i++) {
        this.pointers[i].commit(nativeEvent, emitMove)
      }
      return
    }

    if (computeActivePointer) {
      this.computeActivePointer()
    }

    //commit all pointers, enable the active pointer, and disable all other pointers
    const length = this.pointers.length
    for (let i = 0; i < length; i++) {
      const pointer = this.pointers[i]
      pointer.setEnabled(pointer === this.activePointer, nativeEvent, false)
      pointer.commit(nativeEvent, emitMove, false)
    }
  }

  move(scene: Object3D, nativeEvent: NativeEvent): void {
    if (!this.enabled) {
      return
    }

    //start intersection, build nonCapturedPointers list, and compute the intersection for all captured pointers
    this.nonCapturedPointers.length = 0
    const anyPointerIsCaptured = this.startIntersection(this.nonCapturedPointers, nativeEvent)

    //we only need to intersect the scene if no pointer is captured or (in case one or more pointers are captured) if mulitple pointers can be enabled
    if (!anyPointerIsCaptured || this.enableMultiplePointers) {
      //intersect scene using the non captured pointers
      intersectPointerEventTargets('pointer', scene, this.nonCapturedPointers)

      //finalize the intersection for the non captured pointers
      const nonCapturedPointerLength = this.nonCapturedPointers.length
      for (let i = 0; i < nonCapturedPointerLength; i++) {
        const pointer = this.nonCapturedPointers[i]
        pointer.setIntersection(pointer.intersector.finalizeIntersection(scene))
      }
    }

    //commit the intersection, compute active pointers, and enabling/disabling pointers
    this.commit(nativeEvent, true)
  }

  setEnabled(enabled: boolean, nativeEvent: NativeEvent): void {
    this.enabled = enabled
    const length = this.pointers.length
    for (let i = 0; i < length; i++) {
      const pointer = this.pointers[i]
      pointer.setEnabled(enabled && (this.enableMultiplePointers || pointer == this.activePointer), nativeEvent)
    }
  }
}
