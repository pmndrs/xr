import { Euler, EulerOrder, Matrix4, Quaternion, Vector3 } from 'three'
import { Axis, HandleTransformState } from '../state.js'
import { HandleOptions, HandleTransformOptions } from '../store.js'
import { clamp } from 'three/src/math/MathUtils.js'

const quaternionHelper = new Quaternion()
const eulerHelper = new Euler()

export function applyTransformOptionsToRotation(
  currentRotation: Quaternion,
  rotationOrder: EulerOrder,
  options: HandleTransformOptions,
): Euler {
  const result = new Euler(0, 0, 0, rotationOrder)
  quaternionHelper.copy(currentRotation)
  for (const axisElement of rotationOrder) {
    const axis = axisElement as Axis
    const axisAngle = eulerHelper.setFromQuaternion(currentRotation, rotationOrder)[axis]
    result[axis] = axisAngle
    quaternionHelper.setFromEuler(result).invert()
    currentRotation.premultiply(quaternionHelper)
    result[axis] = applyTransformOptionsToAxis(axis, axisAngle, 0, options)
    currentRotation.setFromEuler(result)
    currentRotation.multiply(quaternionHelper)
  }
  return result
}

/**
 * @requires that the provided vector is a delta vector not the absolute new vector
 */
export function applyTransformOptionsToVector(
  target: Vector3,
  neutralValue: number,
  options: HandleTransformOptions,
): void {
  target.x = applyTransformOptionsToAxis('x', target.x, neutralValue, options)
  target.y = applyTransformOptionsToAxis('y', target.y, neutralValue, options)
  target.z = applyTransformOptionsToAxis('z', target.z, neutralValue, options)
}

/**
 * @requires that the provided value is a delta value not the absolute value
 */
export function applyTransformOptionsToAxis(
  axis: Axis,
  value: number,
  neutralValue: number,
  options: HandleTransformOptions,
): number {
  if (typeof options === 'boolean') {
    return options ? value : neutralValue
  }
  if (typeof options === 'string') {
    return options === axis ? value : neutralValue
  }
  const option = options[axis]
  if (option === false) {
    return neutralValue
  }
  if (Array.isArray(option)) {
    return clamp(value, ...option)
  }
  return value
}

const matrixHelper1 = new Matrix4()
const matrixHelper2 = new Matrix4()

export type BaseHandleStoreData = {
  initialTargetQuaternion: Quaternion
  initialTargetRotation: Euler
}

export function computeHandleTransformState(
  time: number,
  pointerAmount: number,
  targetWorldMatrix: Matrix4,
  storeData: BaseHandleStoreData,
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
  const scale = new Vector3()

  //decompose
  matrixHelper1.decompose(position, quaternion, scale)
  //position and quaternion now contain the resulting transformation before applying the options

  //compute position
  applyTransformOptionsToVector(position, 0, options.translate ?? true)

  //compute rotation
  let rotation: Euler
  const rotateOptions = options.rotate ?? true
  if (rotateOptions === false) {
    quaternion.copy(storeData.initialTargetQuaternion)
    rotation = storeData.initialTargetRotation.clone()
  } else if (
    rotateOptions === true ||
    (typeof rotateOptions != 'string' &&
      rotateOptions.x === true &&
      rotateOptions.y === true &&
      rotateOptions.z === true)
  ) {
    rotation = new Euler().setFromQuaternion(quaternion, storeData.initialTargetRotation.order)
  } else {
    rotation = applyTransformOptionsToRotation(quaternion, storeData.initialTargetRotation.order, rotateOptions)
  }

  //compute scale
  applyTransformOptionsToVector(scale, 1, options.scale ?? true)

  return {
    pointerAmount,
    position,
    quaternion,
    rotation,
    scale,
    time,
  }
}
