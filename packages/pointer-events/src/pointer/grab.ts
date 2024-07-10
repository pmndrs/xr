import { Object3D, Quaternion, Vector3 } from 'three'
import { Pointer, PointerOptions } from '../pointer.js'
import { intersectSphere } from '../intersections/sphere.js'
import { generateUniquePointerId } from './index.js'
import { IntersectionOptions } from '../intersections/index.js'

export type GrabPointerOptions = {
  /**
   * @default 0.07
   */
  radius?: number
} & PointerOptions &
  IntersectionOptions

export const defaultGrabPointerOptions = {
  radius: 0.07,
} satisfies GrabPointerOptions

export function createGrabPointer(
  space: { current?: Object3D | null },
  pointerState: any,
  options: GrabPointerOptions = defaultGrabPointerOptions,
  pointerType: string = 'grab',
) {
  const fromPosition = new Vector3()
  const fromQuaternion = new Quaternion()
  const poinerId = generateUniquePointerId()
  return new Pointer(
    poinerId,
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
        options.radius ?? defaultGrabPointerOptions.radius,
        scene,
        poinerId,
        pointerType,
        pointerState,
        pointerCapture,
        options,
      )
    },
    undefined,
    undefined,
    undefined,
    options,
  )
}
