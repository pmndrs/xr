import { clamp } from 'three/src/math/MathUtils.js'
import { EulerOrder, Object3D, Vector3 } from 'three'
import type { HandleTransformOptions } from './store.js'
import type { Axis } from './state.js'
import { PointerEvent } from '@pmndrs/pointer-events'

type VectorLike = { x: number; y: number; z: number }

/**
 * @returns the locked axis or undefined if not axis was locked
 */
export function applyHandleTransformOptions(
  vector: VectorLike,
  initialVector: VectorLike | undefined,
  options: HandleTransformOptions,
): void {
  if (typeof options === 'boolean') {
    if (options === false && initialVector != null) {
      copy(vector, initialVector)
    }
    return
  }
  if (typeof options === 'string') {
    if (initialVector != null) {
      const tmp = vector[options]
      copy(vector, initialVector)
      vector[options] = tmp
    }
    return
  }
  const { x = true, y = true, z = true } = options
  if (initialVector != null) {
    if (x === false) {
      vector.x = initialVector.x
    }
    if (y === false) {
      vector.y = initialVector.y
    }
    if (x === false) {
      vector.z = initialVector.z
    }
  }
  if (Array.isArray(x)) {
    vector.x = clamp(vector.x, ...x)
  }
  if (Array.isArray(y)) {
    vector.y = clamp(vector.y, ...y)
  }
  if (Array.isArray(z)) {
    vector.z = clamp(vector.z, ...z)
  }
}

function copy(to: VectorLike, from: VectorLike): void {
  to.x = from.x
  to.y = from.y
  to.z = from.z
}

export type Object3DRef = Object3D | { current?: Object3D | null }

export function resolveRef(ref: Object3DRef | undefined): Object3D | undefined | null {
  return ref instanceof Object3D ? ref : ref?.current
}

export function getWorldDirection(event: PointerEvent, target: Vector3): boolean {
  if (event.details.type === 'sphere') {
    return false
  }
  if (event.details.type === 'lines') {
    const { line } = event.details
    target.copy(line.end).sub(line.start).normalize()
    return true
  }
  if (event.details.type === 'camera-ray') {
    target.copy(event.details.direction)
    return true
  }
  target.set(0, 0, -1).applyQuaternion(event.pointerQuaternion)
  return true
}

export function getRotateOrderFromOptions(rotateOptions: HandleTransformOptions): EulerOrder {
  if (typeof rotateOptions === 'boolean') {
    return 'XYZ'
  }

  if (typeof rotateOptions === 'string') {
    switch (rotateOptions) {
      case 'x':
        return 'XYZ'
      case 'y':
        return 'YXZ'
      default:
        return 'ZXY'
    }
  }
  let start = ''
  let end = ''
  if (rotateOptions.x === false) {
    end += 'X'
  } else {
    start += 'X'
  }
  if (rotateOptions.y === false) {
    end += 'Y'
  } else {
    start += 'Y'
  }
  if (rotateOptions.z === false) {
    end += 'Z'
  } else {
    start += 'Z'
  }
  return (start + end) as EulerOrder
}

export function isDefaultOptions(options: HandleTransformOptions) {
  if (typeof options === 'boolean') {
    return options
  }
  if (typeof options === 'string') {
    return false
  }
  if ((options.x ?? true) != true) {
    return false
  }
  if ((options.y ?? true) != true) {
    return false
  }
  if ((options.z ?? true) != true) {
    return false
  }
  return true
}
