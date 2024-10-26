import { Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { HandleTransformState } from '../state.js'
import { HandleOptions, HandleTransformOptions } from '../store.js'
import { computeHandleTransformState } from './utils.js'
import { projectOntoSpace } from '../utils.js'

const matrixHelper1 = new Matrix4()
const matrixHelper2 = new Matrix4()
const vectorHelper = new Vector3()

const OneVector = new Vector3(1, 1, 1)

export type PointerData = {
  initialPointerWorldPoint: Vector3
  initialPointerWorldDirection: Vector3 | undefined
  initialPointerQuaternion: Quaternion
  pointerWorldPoint: Vector3
  pointerWorldDirection: Vector3 | undefined
  pointerWorldQuaternion: Quaternion
}

export function computeOnePointerHandleTransformState(
  time: number,
  pointerData: PointerData,
  initialTargetPosition: Vector3,
  initialTargetQuaternion: Quaternion,
  initialTargetRotation: Euler,
  initialTargetScale: Vector3,
  initialTargetParentWorldMatrix: Matrix4 | undefined,
  targetParentWorldMatrix: Matrix4 | undefined,
  options: HandleOptions<unknown> & { translate?: HandleTransformOptions },
): HandleTransformState {
  projectOntoSpace(
    pointerData.initialPointerWorldPoint,
    vectorHelper.copy(pointerData.initialPointerWorldPoint),
    pointerData.initialPointerWorldDirection,
    options,
    1,
  )
  //pointerWorldMatrix * pointerToTargetParentOffset = TargetParentWorldMatrix =>
  //initialPointerToTargetParentOffset = pointerWorldMatrix-1 * targetParentWorldMatrix
  matrixHelper2.compose(vectorHelper, pointerData.initialPointerQuaternion, OneVector).invert()
  if (initialTargetParentWorldMatrix != null) {
    matrixHelper2.multiply(initialTargetParentWorldMatrix)
  }
  //matrixHelper2 = initialPointerToTargetParentOffset

  projectOntoSpace(
    pointerData.initialPointerWorldPoint,
    vectorHelper.copy(pointerData.pointerWorldPoint),
    pointerData.pointerWorldDirection,
    options,
    1,
  )
  matrixHelper1
    .compose(vectorHelper, pointerData.pointerWorldQuaternion, OneVector)
    .multiply(matrixHelper2)
    .multiply(matrixHelper2.compose(initialTargetPosition, initialTargetQuaternion, initialTargetScale))

  if (targetParentWorldMatrix != null) {
    //to transform matrix helper into target local space
    matrixHelper1.premultiply(matrixHelper2.copy(targetParentWorldMatrix).invert())
  }

  return computeHandleTransformState(
    time,
    () => initialTargetScale.clone(),
    matrixHelper1,
    initialTargetPosition,
    initialTargetQuaternion,
    initialTargetRotation,
    targetParentWorldMatrix,
    options,
  )
}
