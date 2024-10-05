import { Object3D, OrthographicCamera, PerspectiveCamera } from 'three'
import { GetCamera, Pointer, PointerOptions } from '../pointer.js'
import { Intersection, IntersectionOptions, SphereIntersector } from '../intersections/index.js'
import { generateUniquePointerId } from './index.js'

export type TouchPointerOptions = {
  /**
   * @default 0.1
   */
  hoverRadius?: number
  /**
   * @default 0.03
   */
  downRadius?: number
  /**
   * @default 0
   */
  button?: number
} & PointerOptions &
  IntersectionOptions

export function createTouchPointer(
  getCamera: GetCamera,
  space: { current?: Object3D | null },
  pointerState: any,
  options: TouchPointerOptions = {},
  pointerType: string = 'touch',
) {
  return new Pointer(
    generateUniquePointerId(),
    pointerType,
    pointerState,
    new SphereIntersector(space, () => options.hoverRadius ?? 0.1, options),
    getCamera,
    createUpdateTouchPointer(options),
    undefined,
    undefined,
    options,
  )
}

function createUpdateTouchPointer(options: TouchPointerOptions) {
  let wasPointerDown = false
  return (pointer: Pointer) => {
    if (!pointer.getEnabled()) {
      return
    }
    const intersection = pointer.getIntersection()
    const isPointerDown = computeIsPointerDown(intersection, options.downRadius ?? 0.03)
    if (isPointerDown === wasPointerDown) {
      return
    }
    const nativeEvent = { timeStamp: performance.now(), button: options.button ?? 0 }
    if (isPointerDown) {
      pointer.down(nativeEvent)
    } else {
      pointer.up(nativeEvent)
    }
    wasPointerDown = isPointerDown
  }
}

function computeIsPointerDown(intersection: Intersection | undefined, downRadius: number): boolean {
  if (intersection == null) {
    return false
  }
  return intersection.distance <= downRadius
}
