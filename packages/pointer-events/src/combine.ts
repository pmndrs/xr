import { Object3D } from 'three'
import { NativeEvent } from './event.js'
import { Pointer } from './pointer.js'

export class CombinedPointer {
  private pointers: Array<Pointer> = []
  private isDefaults: Array<boolean> = []
  private enabled: boolean = true

  register(pointer: Pointer, isDefault: boolean): () => void {
    this.pointers.push(pointer)
    this.isDefaults.push(isDefault)
    return this.unregister.bind(this, pointer)
  }

  private unregister(pointer: Pointer) {
    const index = this.pointers.indexOf(pointer)
    if (index === -1) {
      return
    }
    this.isDefaults.splice(index, 1)
    this.pointers.splice(index, 1)
  }

  move(scene: Object3D, nativeEvent: NativeEvent): void {
    if (!this.enabled) {
      return
    }
    const length = this.pointers.length

    if (length === 0) {
      return
    }

    for (let i = 0; i < length; i++) {
      this.pointers[i].computeMove(scene, nativeEvent)
    }

    let smallestIndex: number = 0
    let smallestDistance: number = this.pointers[0].getIntersection()?.distance ?? Infinity

    for (let i = 1; i < length; i++) {
      const distance = this.pointers[i].getIntersection()?.distance ?? Infinity
      const isDefault = this.isDefaults[i]
      if ((isDefault && distance === smallestDistance) || distance < smallestDistance) {
        smallestIndex = i
        smallestDistance = distance
      }
    }

    for (let i = 0; i < length; i++) {
      const pointer = this.pointers[i]
      pointer.setEnabled(i === smallestIndex, nativeEvent, false)
      pointer.commit(nativeEvent)
    }
  }

  setEnabled(enabled: boolean, nativeEvent: NativeEvent): void {
    this.enabled = enabled
    const length = this.pointers.length
    for (let i = 0; i < length; i++) {
      this.pointers[i].setEnabled(enabled, nativeEvent)
    }
  }
}
