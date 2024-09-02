import { Object3D } from 'three'
import { Pointer, PointerOptions } from '../pointer.js'
import { SphereIntersector } from '../intersections/sphere.js'
import { generateUniquePointerId } from './index.js'
import { IntersectionOptions } from '../intersections/index.js'

export type GrabPointerOptions = {
  /**
   * @default 0.07
   */
  radius?: number
} & PointerOptions &
  IntersectionOptions

export function createGrabPointer(
  space: { current?: Object3D | null },
  pointerState: any,
  options: GrabPointerOptions = {},
  pointerType: string = 'grab',
) {
  return new Pointer(
    generateUniquePointerId(),
    pointerType,
    pointerState,
    new SphereIntersector((_nativeEvent, fromPosition, fromQuaternion) => {
      const spaceObject = space.current
      if (spaceObject == null) {
        return undefined
      }
      spaceObject.updateWorldMatrix(true, false)
      fromPosition.setFromMatrixPosition(spaceObject.matrixWorld)
      fromQuaternion.setFromRotationMatrix(spaceObject.matrixWorld)
      return options.radius ?? 0.07
    }, options),
    undefined,
    undefined,
    undefined,
    options,
  )
}
