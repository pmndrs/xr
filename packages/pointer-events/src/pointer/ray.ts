import { Object3D, Vector3 } from 'three'
import { Pointer, PointerOptions } from '../pointer.js'
import { IntersectionOptions, RayIntersector } from '../intersections/index.js'
import { generateUniquePointerId } from './index.js'

export type RayPointerOptions = {
  /**
   * @default 0
   * distance to intersection in local space
   */
  minDistance?: number
  /**
   * @default NegZAxis
   */
  direction?: Vector3
} & PointerOptions &
  IntersectionOptions

export function createRayPointer(
  space: { current?: Object3D | null },
  pointerState: any,
  options: RayPointerOptions = {},
  pointerType: string = 'ray',
) {
  return new Pointer(
    generateUniquePointerId(),
    pointerType,
    pointerState,
    new RayIntersector(space, options),
    undefined,
    undefined,
    undefined,
    options,
  )
}
