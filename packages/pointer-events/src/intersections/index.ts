import { Intersection as ThreeIntersection, Quaternion, Vector3, Line3, Vector2 } from 'three'

export type Intersection = ThreeIntersection & {
  pointerPosition: Vector3
  pointerQuaternion: Quaternion
  /**
   * equal to "point" while the pointer is not captured
   * while the pointer is captured, "pointOnFace" represents the point transformed with the pointer along the face even if the pointer does not point on the face
   */
  pointOnFace: Vector3
  localPoint: Vector3
  details:
    | {
        type: 'lines'
        distanceOnLine: number
        lineIndex: number
      }
    | {
        type: 'screen-ray'
        /**
         * distance to the near plane of the camera of the screen
         */
        distanceViewPlane: number
        /**
         * point on the screen for x and y from -1 to 1
         */
        screenPoint: Vector2
      }
    | {
        type: 'ray'
      }
    | {
        type: 'sphere'
        /**
         * set when the event is captured because the "distance" property is only the distance to a "expected intersection"
         */
        distanceToFace?: number
      }
}

export type IntersectionOptions = {
  /**
   * @returns a negative number if i1 should be sorted before i2
   * for sorting by distance use i1.distance - i2.distance
   * => if i1 has a smaller distance the value is negative and i1 is returned as intersection
   */
  customSort?: (
    i1: ThreeIntersection,
    pointerEventsOrder1: number | undefined,
    i2: ThreeIntersection,
    pointerEventsOrder2: number | undefined,
  ) => number
}

export * from './intersector.js'
export * from './lines.js'
export * from './ray.js'
export * from './sphere.js'
