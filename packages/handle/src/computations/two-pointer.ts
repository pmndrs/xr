import { Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { HandleTransformState } from '../state.js'
import { HandleOptions, HandleTransformOptions } from '../store.js'
import {
  addSpaceFromTransformOptions,
  computeHandleTransformState,
  getDeltaQuaternionOnAxis,
  projectOntoSpace,
} from './utils.js'

const deltaHelper1 = new Vector3()
const deltaHelper2 = new Vector3()

const vectorHelper1 = new Vector3()
const vectorHelper2 = new Vector3()
const vectorHelper3 = new Vector3()
const vectorHelper4 = new Vector3()

const scaleHelper = new Vector3()

const matrixHelper1 = new Matrix4()
const matrixHelper2 = new Matrix4()
const matrixHelper3 = new Matrix4()

const qHelper1 = new Quaternion()
const quaterionHelper2 = new Quaternion()

const space: Array<Vector3> = []

export type TwoPointerHandlePointerData = {
  initialPointerWorldPoint: Vector3
  initialPointerWorldDirection: Vector3 | undefined
  initialPointerWorldQuaternion: Quaternion
  pointerWorldPoint: Vector3
  pointerWorldOrigin: Vector3
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
  //compute target parent world quaternion
  if (targetParentWorldMatrix == null) {
    qHelper1.identity()
  } else {
    targetParentWorldMatrix.decompose(vectorHelper1, qHelper1, vectorHelper2)
  }
  //compute space
  space.length = 0
  addSpaceFromTransformOptions(space, qHelper1, storeData.initialTargetRotation, options.translate ?? true, 'translate')
  addSpaceFromTransformOptions(space, qHelper1, storeData.initialTargetRotation, options.rotate ?? true, 'rotate')
  addSpaceFromTransformOptions(space, qHelper1, storeData.initialTargetRotation, options.scale ?? true, 'scale')
  //project pointers into that space
  projectOntoSpace(
    options.projectRays,
    space,
    pointer1Data.initialPointerWorldPoint,
    pointer1Data.pointerWorldOrigin,
    vectorHelper1.copy(pointer1Data.pointerWorldPoint),
    pointer1Data.pointerWorldDirection,
  )
  projectOntoSpace(
    options.projectRays,
    space,
    pointer2Data.initialPointerWorldPoint,
    pointer2Data.pointerWorldOrigin,
    vectorHelper2.copy(pointer2Data.pointerWorldPoint),
    pointer2Data.pointerWorldDirection,
  )

  //compute delta of pointers
  deltaHelper1.copy(pointer2Data.initialPointerWorldPoint).sub(pointer1Data.initialPointerWorldPoint)
  deltaHelper2.copy(vectorHelper2).sub(vectorHelper1)

  //compute delta rotation
  vectorHelper1.copy(deltaHelper1)
  if (storeData.prevTwoPointerDeltaRotation != null) {
    vectorHelper1.applyQuaternion(storeData.prevTwoPointerDeltaRotation)
  }
  vectorHelper1.normalize()
  vectorHelper2.copy(deltaHelper2).normalize()
  qHelper1.setFromUnitVectors(vectorHelper1, vectorHelper2)
  if (storeData.prevTwoPointerDeltaRotation == null) {
    storeData.prevTwoPointerDeltaRotation = new Quaternion()
  } else {
    qHelper1.multiply(storeData.prevTwoPointerDeltaRotation)
  }
  storeData.prevTwoPointerDeltaRotation.copy(qHelper1)
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
  qHelper1.premultiply(quaterionHelper2.setFromAxisAngle(vectorHelper2, angle))

  //compute delta scale
  if (typeof options.scale === 'object' && (options.scale.uniform ?? false)) {
    scaleHelper.setScalar(deltaHelper2.length() / deltaHelper1.length())
  } else {
    //compute the initial world quaternion and initial world scale
    matrixHelper3.compose(
      storeData.initialTargetPosition,
      storeData.initialTargetQuaternion,
      storeData.initialTargetScale,
    )
    if (storeData.initialTargetParentWorldMatrix != null) {
      matrixHelper3.premultiply(storeData.initialTargetParentWorldMatrix)
    }
    matrixHelper3.decompose(vectorHelper3, quaterionHelper2, vectorHelper4)
    //compute the initial scale axis
    vectorHelper1.copy(deltaHelper1).applyQuaternion(quaterionHelper2.invert()).divide(vectorHelper4)
    vectorHelper1.x = Math.abs(vectorHelper1.x)
    vectorHelper1.y = Math.abs(vectorHelper1.y)
    vectorHelper1.z = Math.abs(vectorHelper1.z)
    const maxCompInitialDelta = Math.max(...vectorHelper1.toArray())
    vectorHelper1.divideScalar(maxCompInitialDelta)
    scaleHelper.set(1, 1, 1)
    scaleHelper.addScaledVector(vectorHelper1, deltaHelper2.length() / deltaHelper1.length() - 1)
  }

  //initialPointer1Position * initialPointer1PositionToTargetParentWorldMatrix = targetParentWorldMatrix
  //initialPointer1PositionToTargetParentWorldMatrix = initialPointer1Position-1 * targetParentWorldMatrix

  matrixHelper1
    //apply position and apply transform origin for rotating and scaling
    .makeTranslation(vectorHelper1.copy(deltaHelper2).multiplyScalar(0.5).add(pointer1Data.pointerWorldPoint))
    //apply rotation
    .multiply(matrixHelper2.makeRotationFromQuaternion(qHelper1))
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
