import { Object3D, Quaternion, Scene, Vector3 } from 'three'
import { Pointer, PointerOptions } from '../pointer.js'
import { Intersection, IntersectionOptions, intersectSphere } from '../intersections/index.js'
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

export const defaultTouchPointerOptions = {
  button: 0,
  downRadius: 0.03,
  hoverRadius: 0.1,
} satisfies TouchPointerOptions

export function createTouchPointer(
  space: { current?: Object3D | null },
  pointerState: any,
  options: TouchPointerOptions = defaultTouchPointerOptions,
  pointerType: string = 'touch',
) {
  const fromPosition = new Vector3()
  const fromQuaternion = new Quaternion()
  const pointerId = generateUniquePointerId()
  return new Pointer(
    pointerId,
    pointerType,
    pointerState,
    (scene, _, pointerCapture) => {
      const spaceObject = space.current
      if (spaceObject == null) {
        return undefined
      }
      spaceObject.updateWorldMatrix(true, false)
      fromPosition.setFromMatrixPosition(spaceObject.matrixWorld)
      fromQuaternion.setFromRotationMatrix(spaceObject.matrixWorld)
      return intersectSphere(
        fromPosition,
        fromQuaternion,
        options.hoverRadius ?? defaultTouchPointerOptions.hoverRadius,
        scene,
        pointerId,
        pointerType,
        pointerState,
        pointerCapture,
        options,
      )
    },
    createUpdateTouchPointer(options),
    undefined,
    undefined,
    options,
  )
}

function createUpdateTouchPointer(options: TouchPointerOptions = defaultTouchPointerOptions) {
  let wasPointerDown = false
  return (pointer: Pointer) => {
    if (!pointer.getEnabled()) {
      return
    }
    const intersection = pointer.getIntersection()
    const isPointerDown = computeIsPointerDown(
      intersection,
      options.downRadius ?? defaultTouchPointerOptions.downRadius,
    )
    if (isPointerDown === wasPointerDown) {
      return
    }
    const nativeEvent = { timeStamp: performance.now(), button: options.button ?? defaultTouchPointerOptions.button }
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
