import { Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { HandleTransformState } from '../state.js'
import { HandleOptions, HandleTransformOptions } from '../store.js'
import { projectOntoSpace } from '../utils.js'
import { computeHandleTransformState } from './utils.js'

const vectorHelper1 = new Vector3()
const vectorHelper2 = new Vector3()
const vectorHelper3 = new Vector3()
const vectorHelper4 = new Vector3()

const matrixHelper1 = new Matrix4()
const matrixHelper2 = new Matrix4()

const ZeroVector = new Vector3(0, 0, 0)
const OneVector = new Vector3(1, 1, 1)

export type PointerData = {
  initialPointerWorldPoint: Vector3
  initialPointerWorldDirection: Vector3 | undefined
  initialPointerWorldQuaternion: Quaternion
  pointerWorldPoint: Vector3
  pointerWorldDirection: Vector3 | undefined
  pointerWorldQuaternion: Quaternion
}

export function computeTwoPointerHandleTransformState(
  time: number,
  pointer1Data: PointerData,
  pointer2Data: PointerData,
  initialTargetPosition: Vector3,
  initialTargetQuaternion: Quaternion,
  initialTargetRotation: Euler,
  initialTargetScale: Vector3,
  initialTargetParentWorldMatrix: Matrix4,
  targetParentWorldMatrix: Matrix4,
  options: HandleOptions<unknown> & { translate?: HandleTransformOptions },
): HandleTransformState {
  projectOntoSpace(
    pointer1Data.initialPointerWorldPoint,
    vectorHelper1.copy(pointer1Data.initialPointerWorldPoint),
    pointer1Data.initialPointerWorldDirection,
    options,
    2,
  )
  projectOntoSpace(
    pointer2Data.initialPointerWorldPoint,
    vectorHelper2.copy(pointer2Data.pointerWorldPoint),
    pointer2Data.initialPointerWorldDirection,
    options,
    2,
  )
  projectOntoSpace(
    pointer1Data.initialPointerWorldPoint,
    vectorHelper3.copy(pointer1Data.pointerWorldPoint),
    pointer1Data.pointerWorldDirection,
    options,
    2,
  )
  projectOntoSpace(
    pointer2Data.initialPointerWorldPoint,
    vectorHelper4.copy(pointer2Data.pointerWorldPoint),
    pointer2Data.pointerWorldDirection,
    options,
    2,
  )

  //compute delta
  vectorHelper1.sub(vectorHelper2)

  //compute rotation
  vectorHelper2.copy(vectorHelper1).normalize()
  const quaterionHelper = new Quaternion().setFromUnitVectors(
    vectorHelper1.copy(deltaHelper1).normalize(),
    vectorHelper2.copy(deltaHelper2).normalize(),
  )

  matrixHelper1
    .makeTranslation(vectorHelper1.copy(deltaHelper2).multiplyScalar(0.5).add(pointer1Data.pointerWorldPoint))
    .multiply(matrixHelper2.compose(ZeroVector, quaterionHelper, OneVector))
    .multiply(matrixHelper2.makeTranslation(vectorHelper1.copy(deltaHelper1).multiplyScalar(0.5).negate()))

  //initialPointer1Position * initialPointer1PositionToTargetParentWorldMatrix = targetParentWorldMatrix
  //initialPointer1PositionToTargetParentWorldMatrix = initialPointer1Position-1 * targetParentWorldMatrix
  matrixHelper2
    .makeTranslation(vectorHelper1.copy(pointer1Data.initialPointerWorldPoint).negate())
    .multiply(initialTargetParentWorldMatrix)
  matrixHelper1
    .multiply(matrixHelper2)
    .multiply(matrixHelper2.compose(initialTargetPosition, initialTargetQuaternion, initialTargetScale))

  return computeHandleTransformState(
    time,
    () => {},
    matrixHelper1,
    initialTargetPosition,
    initialTargetQuaternion,
    initialTargetRotation,
    targetParentWorldMatrix,
    options,
  )
}
