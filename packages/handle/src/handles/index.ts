import type { Vector2Tuple, ColorRepresentation } from 'three'
import type { Axis } from '../state.js'

export type HandlesProperties =
  | boolean
  | {
      x?: boolean | Vector2Tuple
      y?: boolean | Vector2Tuple
      z?: boolean | Vector2Tuple
      e?: boolean | Vector2Tuple
    }
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
