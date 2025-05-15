import type { Axis } from '../state.js'
import type { Vector2Tuple } from 'three'

export type HandlesProperties =
  | boolean
  | {
      x?: boolean | Vector2Tuple | 'disabled'
      y?: boolean | Vector2Tuple | 'disabled'
      z?: boolean | Vector2Tuple | 'disabled'
      e?: boolean | Vector2Tuple | 'disabled'
    }
  | 'disabled'
  | Axis
  | 'e'

export type TransformHandlesSpace = 'local' | 'world'

export * from './context.js'
export * from './material.js'
export * from './axis.js'
export * from './registered.js'
export * from './drag.js'
export * from './pivot/index.js'
export * from './translate/index.js'
export * from './scale/index.js'
export * from './rotate/index.js'
export * from './transform.js'
