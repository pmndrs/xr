import { Axis, HandleTransformOptions } from '@pmndrs/handle'
import { useMemo } from 'react'
import { Vector2Tuple, Vector3Tuple } from 'three'
import type { RotateHandlesProperties } from './rotate/index.js'

export function extractHandleTransformOptions(
  key: 'x' | 'y' | 'z' | 'xy' | 'yz' | 'xz' | 'xyz' | 'e',
  enabled: RotateHandlesProperties['enabled'] = true,
) {
  if (enabled === false) {
    return false
  }
  if (enabled === true) {
    const result: Exclude<HandleTransformOptions, Vector3Tuple | boolean | Axis> = {
      x: false,
      y: false,
      z: false,
    }
    for (const axis of key) {
      result[axis as Axis] = true
    }
    return result
  }
  if (typeof enabled === 'string') {
    return enabled === key
      ? {
          x: false,
          y: false,
          z: false,
          [key]: true,
        }
      : false
  }
  const result: Exclude<HandleTransformOptions, Vector3Tuple | boolean | Axis> = {
    x: false,
    y: false,
    z: false,
  }
  for (const axis of key) {
    const axisOption = enabled[axis as Axis] ?? true
    if (axisOption === false) {
      return false
    }
    result[axis as Axis] = axisOption
  }
  return result
}

export function useExtractHandleTransformOptions(
  key: 'x' | 'y' | 'z' | 'xy' | 'yz' | 'xz' | 'xyz' | 'e',
  options: RotateHandlesProperties['enabled'] | undefined,
) {
  return useMemo(() => extractHandleTransformOptions(key, options), [key, options])
}

type H = HandleTransformOptions & {}
