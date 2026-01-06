/**
 * R3F compatibility types - minimal interfaces for @react-three/fiber compatibility
 * without requiring it as a dependency.
 */

import type { Intersection as ThreeIntersection } from './intersections/index.js'
import type { Object3D, OrthographicCamera, PerspectiveCamera, Ray, Vector2, Vector3 } from 'three'

export type Camera = OrthographicCamera | PerspectiveCamera

export interface Intersection extends ThreeIntersection {
  eventObject: Object3D
}

export interface IntersectionEvent<TSourceEvent> extends Intersection {
  intersections: Intersection[]
  unprojectedPoint: Vector3
  pointer: Vector2
  delta: number
  ray: Ray
  camera: Camera
  stopPropagation: () => void
  nativeEvent: TSourceEvent
  stopped: boolean
}

export interface R3FState {
  onPointerMissed?: (event: MouseEvent) => void
}

export interface R3FStore {
  getState: () => R3FState
}

export interface R3FInstance {
  eventCount: number
  handlers: Record<string, ((e: unknown) => void) | undefined>
  root: R3FStore
}
