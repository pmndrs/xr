import { Object3D, Vector3 } from 'three'
import { Pointer, PointerOptions } from '../pointer.js'
import { IntersectionOptions, LinesIntersector } from '../intersections/index.js'
import { generateUniquePointerId } from './index.js'

export type LinesPointerOptions = {
  /**
   * @default 0
   * distance to intersection in local space
   */
  minDistance?: number
  /**
   * points for that compose the lines
   * @default [new Vector3(0,0,0), new Vector3(0,0,1)]
   */
  linePoints?: Array<Vector3>
} & PointerOptions &
  IntersectionOptions

export function createLinesPointer(
  space: { current?: Object3D | null },
  pointerState: any,
  options: LinesPointerOptions = {},
  pointerType: string = 'lines',
) {
  return new Pointer(
    generateUniquePointerId(),
    pointerType,
    pointerState,
    new LinesIntersector((_nativeEvent, fromMatrixWorld) => {
      const spaceObject = space.current
      if (spaceObject == null) {
        return false
      }
      fromMatrixWorld.copy(spaceObject.matrixWorld)
      return true
    }, options),
    undefined,
    undefined,
    undefined,
    options,
  )
}
