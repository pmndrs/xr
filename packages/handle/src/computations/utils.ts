import { Euler, Matrix4, Plane, Quaternion, Vector3, Vector3Tuple } from 'three'
import { Axis, HandleTransformState } from '../state.js'
import { HandleOptions, HandleTransformOptions } from '../store.js'
import { clamp } from 'three/src/math/MathUtils.js'

const matrixHelper1 = new Matrix4()
const matrixHelper2 = new Matrix4()

export type BaseHandleStoreData = {
  initialTargetQuaternion: Quaternion
  initialTargetRotation: Euler
  initialTargetPosition: Vector3
  initialTargetScale: Vector3
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
  applyTransformOptionsToVector(position, storeData.initialTargetPosition, options.translate ?? true)

  //compute rotation
  let rotation: Euler
  const rotateOptions = options.rotate ?? true
  if (rotateOptions === false) {
    quaternion.copy(storeData.initialTargetQuaternion)
    rotation = storeData.initialTargetRotation.clone()
  } else if (
    rotateOptions === true ||
    (typeof rotateOptions != 'string' &&
      !Array.isArray(rotateOptions) &&
      rotateOptions.x === true &&
      rotateOptions.y === true &&
      rotateOptions.z === true)
  ) {
    rotation = new Euler().setFromQuaternion(quaternion, storeData.initialTargetRotation.order)
  } else {
    rotation = applyTransformOptionsToRotation(quaternion, storeData.initialTargetRotation, rotateOptions)
  }

  //compute scale
  applyTransformOptionsToVector(scale, storeData.initialTargetScale, options.scale ?? true)

  return {
    pointerAmount,
    position,
    quaternion,
    rotation,
    scale,
    time,
  }
}

const pHelper = new Plane()
const v1Helper = new Vector3()
const v2Helper = new Vector3()
const v3Helper = new Vector3()
const qHelper = new Quaternion()

export function getDeltaQuaternionOnAxis(normalizedAxis: Vector3, from: Quaternion, to: Quaternion): number {
  pHelper.normal.copy(normalizedAxis)
  pHelper.constant = 0
  getPerpendicular(v1Helper, pHelper.normal)
  v2Helper.copy(v1Helper)
  v2Helper.applyQuaternion(qHelper.copy(from).invert().premultiply(to))
  pHelper.projectPoint(v1Helper, v1Helper).normalize()
  pHelper.projectPoint(v2Helper, v2Helper).normalize()
  return (v3Helper.crossVectors(v1Helper, pHelper.normal).dot(v2Helper) < 0 ? 1 : -1) * v1Helper.angleTo(v2Helper)
}

function getPerpendicular(target: Vector3, from: Vector3): void {
  if (from.x === 0) {
    target.set(1, 0, 0)
    return
  }
  if (from.y === 0) {
    target.set(0, 1, 0)
    return
  }
  if (from.z === 0) {
    target.set(0, 0, 1)
    return
  }
  target.set(-from.y, from.x, 0)
}

const quaternionHelper = new Quaternion()
const eulerHelper = new Euler()

export function applyTransformOptionsToRotation(
  currentRotation: Quaternion,
  initialRotation: Euler,
  options: HandleTransformOptions,
): Euler {
  const result = new Euler(0, 0, 0, initialRotation.order)
  let inverted = false
  for (const axisElement of initialRotation.order) {
    const axis = axisElement.toLowerCase() as Axis
    const axisAngle =
      eulerHelper.setFromQuaternion(currentRotation, initialRotation.order)[axis] + (inverted ? Math.PI : 0)
    const transformedAxisAngle = Array.isArray(options)
      ? axisAngle
      : applyTransformOptionsToAxis(axis, axisAngle, initialRotation[axis], options)

    if (Math.abs(axisAngle - transformedAxisAngle) > Math.PI / 2) {
      inverted = !inverted
    }

    if (axisAngle != transformedAxisAngle) {
      //currentRotation = currentRotation * result-1 * delta * result
      currentRotation.multiply(quaternionHelper.setFromEuler(result).invert())
      const delta = axisAngle - transformedAxisAngle
      result[axis] = delta
      currentRotation.multiply(quaternionHelper.setFromEuler(result))
    }

    result[axis] = transformedAxisAngle
  }
  currentRotation.setFromEuler(result)
  return result
}

const applyTransformNormal = new Vector3()
const applyTransformPlane = new Plane()
const applyTransformCross1 = new Vector3()
const applyTransformCross2 = new Vector3()

function applyTransformOptionsToVector(target: Vector3, initialVector: Vector3, options: HandleTransformOptions): void {
  if (Array.isArray(options)) {
    switch (options.length) {
      case 0:
        target.copy(initialVector)
        return
      case 1:
        target.sub(initialVector)
        projectPointOntoNormal(target, applyTransformNormal.fromArray(options[0]))
        target.add(initialVector)
        return
      case 2:
        applyTransformNormal.crossVectors(
          applyTransformCross1.fromArray(options[0]),
          applyTransformCross2.fromArray(options[1]),
        )
        applyTransformPlane.setFromNormalAndCoplanarPoint(applyTransformNormal, initialVector)
        const distanceToPlane = planeHelper.distanceToPoint(target)
        target.addScaledVector(applyTransformNormal, -distanceToPlane)
        return
    }
    //3 or more, we do nothing
    return
  }
  target.x = applyTransformOptionsToAxis('x', target.x, initialVector.x, options)
  target.y = applyTransformOptionsToAxis('y', target.y, initialVector.y, options)
  target.z = applyTransformOptionsToAxis('z', target.z, initialVector.z, options)
}

/**
 * @requires that the provided value is a delta value not the absolute value
 */
function applyTransformOptionsToAxis(
  axis: Axis,
  value: number,
  neutralValue: number,
  options: Exclude<HandleTransformOptions, Array<Vector3Tuple>>,
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

export function projectOntoSpace(
  space: Array<Vector3>,
  initialWorldPoint: Vector3,
  worldPoint: Vector3,
  worldDirection: Vector3 | undefined,
): void {
  switch (space.length) {
    case 0:
    case 3:
      return
    case 1:
      projectOntoAxis(initialWorldPoint, ...(space as [Vector3]), worldPoint, worldDirection)
      return
    case 2:
      projectOntoPlane(initialWorldPoint, ...(space as [Vector3, Vector3]), worldPoint, worldDirection)
      return
  }
  throw new Error(
    `space cannot be ${space.length}D but received (${space.map((s) => s.toArray().join('/')).join('; ')})`,
  )
}

const axisVectorMap = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
}

export function addSpaceFromTransformOptions(
  target: Array<Vector3>,
  parentWorldQuaternion: Quaternion,
  initialLocalRotation: Euler,
  options: HandleTransformOptions,
  type: 'translate' | 'rotate' | 'scale',
): void {
  if (options === false) {
    return
  }
  if (options === true) {
    target[0] = axisVectorMap.x
    target[1] = axisVectorMap.y
    target[2] = axisVectorMap.z
    return
  }
  if (typeof options === 'string') {
    addSpaceFromAxis(target, parentWorldQuaternion, initialLocalRotation, options, type)
    return
  }
  if (Array.isArray(options)) {
    for (const axis of options) {
      addSpaceFromAxis(target, parentWorldQuaternion, initialLocalRotation, axis, type)
    }
    return
  }
  if (options.x !== false) {
    addSpaceFromAxis(target, parentWorldQuaternion, initialLocalRotation, 'x', type)
  }
  if (options.y !== false) {
    addSpaceFromAxis(target, parentWorldQuaternion, initialLocalRotation, 'y', type)
  }
  if (options.z !== false) {
    addSpaceFromAxis(target, parentWorldQuaternion, initialLocalRotation, 'z', type)
  }
}

const rHelper = new Quaternion()
const eHelper = new Euler()
const axisHelper = new Vector3()
const otherVectorHelper = new Vector3()
const resultVectorHelper = new Vector3()

function addSpaceFromAxis(
  target: Array<Vector3>,
  targetParentWorldQuaternion: Quaternion,
  initialTargetRotation: Euler,
  axis: Axis | Vector3Tuple,
  type: 'translate' | 'rotate' | 'scale',
): void {
  if (Array.isArray(axis)) {
    axisHelper.set(...axis)
  } else {
    axisHelper.copy(axisVectorMap[axis])
  }
  if (type === 'translate') {
    axisHelper.applyQuaternion(targetParentWorldQuaternion)
    addAxisToSpace(target, axisHelper)
    return
  }
  if (type === 'scale') {
    if (Array.isArray(axis)) {
      rHelper.identity()
    } else {
      rHelper.setFromEuler(initialTargetRotation)
    }
    rHelper.premultiply(targetParentWorldQuaternion)
    axisHelper.applyQuaternion(rHelper)
    addAxisToSpace(target, axisHelper)
    return
  }

  if (Array.isArray(axis)) {
    eHelper.set(0, 0, 0)
  } else {
    eHelper.copy(initialTargetRotation)
    for (let i = 2; i >= 0; i--) {
      const rotationAxis = initialTargetRotation.order[i].toLowerCase()
      eHelper[rotationAxis as Axis] = 0
      if (rotationAxis === axis) {
        break
      }
    }
  }

  rHelper.setFromEuler(eHelper).premultiply(targetParentWorldQuaternion)

  axisHelper.normalize()

  // Step 1: Choose a random vector that is not parallel to the original
  otherVectorHelper.set(0, 1, 0)
  if (axisHelper.dot(otherVectorHelper) > 0.99) {
    otherVectorHelper.set(0, 0, 1) // Change the random vector if it's too parallel
  }

  // Step 2: First perpendicular vector
  resultVectorHelper.crossVectors(axisHelper, otherVectorHelper).normalize()
  otherVectorHelper.copy(resultVectorHelper)

  resultVectorHelper.applyQuaternion(rHelper)
  addAxisToSpace(target, resultVectorHelper)

  // Step 3: Second perpendicular vector
  resultVectorHelper.crossVectors(axisHelper, otherVectorHelper).normalize()

  resultVectorHelper.applyQuaternion(rHelper)
  addAxisToSpace(target, resultVectorHelper)
}

const crossHelper = new Vector3()

function addAxisToSpace(target: Array<Vector3>, axis: Vector3): void {
  if (target.length === 3) {
    return
  }
  if (target.length === 0) {
    target.push(axis.clone())
    return
  }
  if (target.length === 1) {
    if (Math.abs(target[0].dot(axis)) < 0.999) {
      target.push(axis.clone())
    }
    return
  }
  crossHelper.crossVectors(target[0], target[1])
  if (Math.abs(crossHelper.dot(axis)) < 0.001) {
    return
  }
  target.push(axis.clone())
}

const planeHelper = new Plane()
const normalHelper = new Vector3()

function projectOntoPlane(
  initialWorldPoint: Vector3,
  _axis1: Vector3,
  _axis2: Vector3,
  worldPoint: Vector3,
  worldDirection: Vector3 | undefined,
): void {
  normalHelper.crossVectors(_axis1, _axis2).normalize()
  planeHelper.setFromNormalAndCoplanarPoint(normalHelper, initialWorldPoint)
  if (worldDirection == null || Math.abs(normalHelper.dot(worldDirection)) < 0.001) {
    planeHelper.projectPoint(worldPoint, worldPoint)
    return
  }
  const distanceToPlane = planeHelper.distanceToPoint(worldPoint)
  let distanceAlongDirection = distanceToPlane / worldDirection.dot(planeHelper.normal)
  worldPoint.addScaledVector(worldDirection, -distanceAlongDirection)
}

const vectorHelper = new Vector3()

/**
 * finds the intersection between the given axis (infinite line) and another infinite line provided with point and direction
 */
export function projectOntoAxis(
  initialWorldPoint: Vector3,
  axis: Vector3,
  worldPoint: Vector3,
  worldDirection: Vector3 | undefined,
): void {
  if (worldDirection == null || Math.abs(axis.dot(worldDirection)) > 0.999) {
    worldPoint.sub(initialWorldPoint)
    projectPointOntoNormal(worldPoint, axis)
    worldPoint.add(initialWorldPoint)
    return
  }

  vectorHelper.subVectors(worldPoint, initialWorldPoint)

  // 2. Calculate the dot products needed
  const d1d2 = axis.dot(worldDirection)
  const d1p1p2 = axis.dot(vectorHelper)
  const d2p1p2 = worldDirection.dot(vectorHelper)

  // 3. Calculate the parameters t for the closest points
  const denominator = 1 - d1d2 * d1d2
  const t = (d1p1p2 - d1d2 * d2p1p2) / denominator

  // 4. Calculate the nearest point on the first line
  worldPoint.copy(initialWorldPoint).addScaledVector(axis, t)
}

export function projectPointOntoNormal(point: Vector3, normal: Vector3) {
  const dot = point.dot(normal)
  point.copy(normal).multiplyScalar(dot)
}
