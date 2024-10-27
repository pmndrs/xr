import { Euler, Matrix4, Plane, Quaternion, Vector3 } from 'three'
import { Axis, HandleTransformState } from '../state.js'
import { HandleOptions, HandleTransformOptions } from '../store.js'
import { getSpaceFromOptions, projectOntoSpace } from '../utils.js'
import { computeHandleTransformState } from './utils.js'

const deltaHelper1 = new Vector3()
const deltaHelper2 = new Vector3()

const vectorHelper1 = new Vector3()
const vectorHelper2 = new Vector3()
const vectorHelper3 = new Vector3()
const vectorHelper4 = new Vector3()

const scaleHelper = new Vector3()

const ZeroVector = new Vector3(0, 0, 0)
const OneVector = new Vector3(1, 1, 1)

const matrixHelper1 = new Matrix4()
const matrixHelper2 = new Matrix4()
const matrixHelper3 = new Matrix4()

const quaterionHelper1 = new Quaternion()
const quaterionHelper2 = new Quaternion()

const spaceHelper = new Set<Axis>()

export type TwoPointerHandlePointerData = {
  initialPointerWorldPoint: Vector3
  initialPointerWorldDirection: Vector3 | undefined
  initialPointerWorldQuaternion: Quaternion
  pointerWorldPoint: Vector3
  pointerWorldDirection: Vector3 | undefined
  pointerWorldQuaternion: Quaternion
  prevPointerWorldQuaternion: Quaternion
}

export type TwoPointerHandleStoreData = {
  initialTargetPosition: Vector3
  initialTargetQuaternion: Quaternion
  initialTargetRotation: Euler
  initialTargetScale: Vector3
  initialTargetParentWorldMatrix: Matrix4 | undefined
  prevTwoPointerDeltaRotation: Quaternion | undefined
  prevAngle: number | undefined
}

export function computeTwoPointerHandleTransformState(
  time: number,
  pointer1Data: TwoPointerHandlePointerData,
  pointer2Data: TwoPointerHandlePointerData,
  storeData: TwoPointerHandleStoreData,
  targetParentWorldMatrix: Matrix4 | undefined,
  options: HandleOptions<any> & { translate?: HandleTransformOptions },
): HandleTransformState {
  spaceHelper.clear()
  getSpaceFromOptions(spaceHelper, options, 2)
  projectOntoSpace(
    spaceHelper,
    pointer1Data.initialPointerWorldPoint,
    vectorHelper1.copy(pointer1Data.initialPointerWorldPoint),
    pointer1Data.initialPointerWorldDirection,
  )
  projectOntoSpace(
    spaceHelper,
    pointer2Data.initialPointerWorldPoint,
    vectorHelper2.copy(pointer2Data.initialPointerWorldPoint),
    pointer2Data.initialPointerWorldDirection,
  )
  projectOntoSpace(
    spaceHelper,
    pointer1Data.initialPointerWorldPoint,
    vectorHelper3.copy(pointer1Data.pointerWorldPoint),
    pointer1Data.pointerWorldDirection,
  )
  projectOntoSpace(
    spaceHelper,
    pointer2Data.initialPointerWorldPoint,
    vectorHelper4.copy(pointer2Data.pointerWorldPoint),
    pointer2Data.pointerWorldDirection,
  )

  deltaHelper1.copy(vectorHelper2).sub(vectorHelper1)
  deltaHelper2.copy(vectorHelper4).sub(vectorHelper3)

  //compute delta rotation
  vectorHelper1.copy(deltaHelper1)
  if (storeData.prevTwoPointerDeltaRotation != null) {
    vectorHelper1.applyQuaternion(storeData.prevTwoPointerDeltaRotation)
  }
  vectorHelper1.normalize()
  vectorHelper2.copy(deltaHelper2).normalize()
  quaterionHelper1.setFromUnitVectors(vectorHelper1, vectorHelper2)
  if (storeData.prevTwoPointerDeltaRotation == null) {
    storeData.prevTwoPointerDeltaRotation = new Quaternion()
  } else {
    quaterionHelper1.multiply(storeData.prevTwoPointerDeltaRotation)
  }
  storeData.prevTwoPointerDeltaRotation.copy(quaterionHelper1)
  const angle =
    (getDeltaQuaternionOnAxis(
      vectorHelper2,
      pointer1Data.prevPointerWorldQuaternion,
      pointer1Data.pointerWorldQuaternion,
    ) +
      getDeltaQuaternionOnAxis(
        vectorHelper2,
        pointer2Data.prevPointerWorldQuaternion,
        pointer2Data.pointerWorldQuaternion,
      )) *
      0.5 +
    (storeData.prevAngle ?? 0)
  storeData.prevAngle = angle
  quaterionHelper1.premultiply(quaterionHelper2.setFromAxisAngle(vectorHelper2, angle))

  //initial target world matrix
  matrixHelper3.compose(
    storeData.initialTargetPosition,
    storeData.initialTargetQuaternion,
    storeData.initialTargetScale,
  )
  if (storeData.initialTargetParentWorldMatrix != null) {
    matrixHelper3.premultiply(storeData.initialTargetParentWorldMatrix)
  }
  matrixHelper3.decompose(vectorHelper3, quaterionHelper2, vectorHelper4)

  //compute delta scale; TODO: respect uniform scaling
  if (typeof options.scale === 'object' && (options.scale.uniform ?? false)) {
    vectorHelper1.set(1, 1, 1)
  } else {
    vectorHelper1.copy(deltaHelper1).applyQuaternion(quaterionHelper2.invert()).divide(vectorHelper4)
    vectorHelper1.x = Math.abs(vectorHelper1.x)
    vectorHelper1.y = Math.abs(vectorHelper1.y)
    vectorHelper1.z = Math.abs(vectorHelper1.z)
    const maxCompInitialDelta = Math.max(...vectorHelper1.toArray())
    vectorHelper1.divideScalar(maxCompInitialDelta)
  }
  scaleHelper.set(1, 1, 1)
  scaleHelper.addScaledVector(vectorHelper1, deltaHelper2.length() / deltaHelper1.length() - 1)

  //initialPointer1Position * initialPointer1PositionToTargetParentWorldMatrix = targetParentWorldMatrix
  //initialPointer1PositionToTargetParentWorldMatrix = initialPointer1Position-1 * targetParentWorldMatrix

  matrixHelper1
    //apply position and apply transform origin for rotating and scaling
    .makeTranslation(vectorHelper1.copy(deltaHelper2).multiplyScalar(0.5).add(pointer1Data.pointerWorldPoint))
    //apply rotation
    .multiply(matrixHelper2.makeRotationFromQuaternion(quaterionHelper1))
    //apply scale
    //  apply original rotation
    .multiply(matrixHelper2.makeRotationFromQuaternion(quaterionHelper2.invert()))
    //  apply scale
    .multiply(matrixHelper2.makeScale(scaleHelper.x, scaleHelper.y, scaleHelper.z))
    //  apply inverted origin rotation
    .multiply(matrixHelper2.makeRotationFromQuaternion(quaterionHelper2.invert()))
    //apply position and apply transform origin for rotating and scaling
    .multiply(
      matrixHelper2.makeTranslation(
        vectorHelper1.copy(deltaHelper1).multiplyScalar(0.5).add(pointer1Data.initialPointerWorldPoint).negate(),
      ),
    )
    //apply initial target world matrix
    .multiply(matrixHelper3)

  return computeHandleTransformState(time, 2, matrixHelper1, storeData, targetParentWorldMatrix, options)
}

const planeHelper = new Plane()
const v1Helper = new Vector3()
const v2Helper = new Vector3()
const v3Helper = new Vector3()
const qHelper = new Quaternion()

function getDeltaQuaternionOnAxis(normalizedAxis: Vector3, from: Quaternion, to: Quaternion): number {
  planeHelper.normal.copy(normalizedAxis)
  planeHelper.constant = 0
  getPerpendicular(v1Helper, planeHelper.normal)
  v2Helper.copy(v1Helper)
  v2Helper.applyQuaternion(qHelper.copy(from).invert().premultiply(to))
  planeHelper.projectPoint(v1Helper, v1Helper).normalize()
  planeHelper.projectPoint(v2Helper, v2Helper).normalize()
  return (v3Helper.crossVectors(v1Helper, planeHelper.normal).dot(v2Helper) < 0 ? 1 : -1) * v1Helper.angleTo(v2Helper)
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
