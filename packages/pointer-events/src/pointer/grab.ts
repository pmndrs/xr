import { Object3D } from 'three'
import { GetCamera, Pointer, PointerOptions } from '../pointer.js'
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
  getCamera: GetCamera,
  space: { current?: Object3D | null },
  pointerState: any,
  options: GrabPointerOptions = {},
  pointerType: string = 'grab',
) {
  return new Pointer(
    generateUniquePointerId(),
    pointerType,
    pointerState,
    new SphereIntersector(space, () => options.radius ?? 0.07, options),
    getCamera,
    undefined,
    undefined,
    undefined,
    options,
  )
}
