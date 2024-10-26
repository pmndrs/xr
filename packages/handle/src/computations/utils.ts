import { Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { Axis, HandleTransformState } from '../state.js'
import { HandleOptions, HandleTransformOptions } from '../store.js'
import { clamp } from 'three/src/math/MathUtils.js'

const quaternionHelper = new Quaternion()
const eulerHelper = new Euler()

export function applyTransformOptionsToRotation(
  currentRotation: Quaternion,
  initialRotation: Euler,
  options: HandleTransformOptions,
): Euler {
  const order = initialRotation.order
  const result = new Euler(0, 0, 0, order)
  quaternionHelper.copy(currentRotation)
  for (const axisElement of order) {
    const axis = axisElement as Axis
    const axisAngle = eulerHelper.setFromQuaternion(currentRotation, order)[axis]
    result[axis] = axisAngle
    quaternionHelper.setFromEuler(result).conjugate()
    currentRotation.premultiply(quaternionHelper)
    const initialAxisAngle = initialRotation[axis]
    result[axis] = initialAxisAngle + applyTransformOptionsToAxis(axis, axisAngle - initialAxisAngle, options)
    currentRotation.setFromEuler(result)
    currentRotation.multiply(quaternionHelper)
  }
  return result
}

/**
 * @requires that the provided vector is a delta vector not the absolute new vector
 */
export function applyTransformOptionsToVector(target: Vector3, options: HandleTransformOptions): void {
  target.x = applyTransformOptionsToAxis('x', target.x, options)
  target.y = applyTransformOptionsToAxis('y', target.y, options)
  target.z = applyTransformOptionsToAxis('z', target.z, options)
}

/**
 * @requires that the provided value is a delta value not the absolute value
 */
export function applyTransformOptionsToAxis(axis: Axis, value: number, options: HandleTransformOptions): number {
  if (typeof options === 'boolean') {
    return options ? value : 0
  }
  if (typeof options === 'string') {
    return options === axis ? value : 0
  }
  const option = options[axis]
  if (option === false) {
    return 0
  }
  if (Array.isArray(option)) {
    return clamp(value, ...option)
  }
  return value
}

const matrixHelper1 = new Matrix4()
const matrixHelper2 = new Matrix4()
const vectorHelper = new Vector3()

export function computeHandleTransformState(
  time: number,
  computeScale: () => Vector3,
  targetWorldMatrix: Matrix4,
  initialTargetPosition: Vector3,
  initialTargetQuaternion: Quaternion,
  initialTargetRotation: Euler,
  targetParentWorldMatrix: Matrix4 | undefined,
  options: HandleOptions<unknown> & { translate?: HandleTransformOptions },
): HandleTransformState {
  matrixHelper1.copy(targetWorldMatrix)
  if (targetParentWorldMatrix != null) {
    //to transform matrix helper into target local space
    matrixHelper1.premultiply(matrixHelper2.copy(targetParentWorldMatrix).invert())
  }

  //new values
  const position = new Vector3()
  const quaternion = new Quaternion()

  //decompose
  matrixHelper1.decompose(position, quaternion, vectorHelper)
  //position and quaternion now contain the resulting transformation before applying the options

  //compute position
  position.sub(initialTargetPosition)
  applyTransformOptionsToVector(position, options.translate ?? true)
  position.add(initialTargetPosition)

  //compute rotation
  let rotation: Euler
  const rotateOptions = options.rotate ?? true
  if (rotateOptions === false) {
    quaternion.copy(initialTargetQuaternion)
    rotation = initialTargetRotation.clone()
  } else if (
    rotateOptions === true ||
    (typeof rotateOptions != 'string' &&
      rotateOptions.x === true &&
      rotateOptions.y === true &&
      rotateOptions.z === true)
  ) {
    rotation = new Euler().setFromQuaternion(quaternion, initialTargetRotation.order)
  } else {
    rotation = applyTransformOptionsToRotation(quaternion, initialTargetRotation, rotateOptions)
  }

  return {
    pointerAmount: 1,
    position,
    quaternion,
    rotation,
    scale: computeScale(),
    time,
  }
}
