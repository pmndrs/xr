import { Object3D, Quaternion, Vector3 } from 'three'
import { Pointer, PointerOptions } from '../pointer.js'
import { Intersection, IntersectionOptions, intersectLines, intersectRay } from '../intersections/index.js'
import { generateUniquePointerId } from './index.js'

export type RayPointerOptions = {
  /**
   * @default 0
   * distance to intersection in local space
   */
  minDistance?: number
  /**
   * @default null
   */
  linePoints?: Array<Vector3> | null
  /**
   * @default NegZAxis
   */
  direction?: Vector3
} & PointerOptions &
  IntersectionOptions

const NegZAxis = new Vector3(0, 0, -1)
const vectorHelper = new Vector3()

export const defaultRayPointerOptions = {
  direction: NegZAxis,
  minDistance: 0,
  linePoints: null,
} satisfies RayPointerOptions

export function createRayPointer(
  space: { current?: Object3D | null },
  pointerState: any,
  options: RayPointerOptions = defaultRayPointerOptions,
  pointerType: string = 'ray',
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
      let intersection: Intersection | undefined
      const linePoints = options.linePoints ?? defaultRayPointerOptions.linePoints
      if (linePoints == null) {
        fromPosition.setFromMatrixPosition(spaceObject.matrixWorld)
        fromQuaternion.setFromRotationMatrix(spaceObject.matrixWorld)
        intersection = intersectRay(
          fromPosition,
          fromQuaternion,
          options.direction ?? defaultRayPointerOptions.direction,
          scene,
          pointerId,
          pointerType,
          pointerState,
          pointerCapture,
          options,
        )
      } else {
        intersection = intersectLines(
          spaceObject.matrixWorld,
          linePoints,
          scene,
          pointerId,
          pointerType,
          pointerState,
          pointerCapture,
          options,
        )
      }
      if (intersection == null) {
        return undefined
      }
      const localDistance = intersection.distance * spaceObject.getWorldScale(vectorHelper).x
      if (localDistance < (options.minDistance ?? defaultRayPointerOptions.minDistance)) {
        return undefined
      }
      return intersection
    },
    undefined,
    undefined,
    undefined,
    options,
  )
}
