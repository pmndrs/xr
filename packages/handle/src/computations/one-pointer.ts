import { Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { HandleTransformState } from '../state.js'
import { HandleOptions, HandleTransformOptions } from '../store.js'
import { computeHandleTransformState, addSpaceFromTransformOptions, projectOntoSpace } from './utils.js'

const matrixHelper1 = new Matrix4()
const matrixHelper2 = new Matrix4()
const vectorHelper1 = new Vector3()
const vectorHelper2 = new Vector3()
const quaternionHelper = new Quaternion()

const OneVector = new Vector3(1, 1, 1)
const spaceHelper: Array<Vector3> = []

export type OnePointerHandlePointerData = {
  initialPointerWorldPoint: Vector3
  initialPointerWorldDirection: Vector3 | undefined
  initialPointerWorldQuaternion: Quaternion
  pointerWorldPoint: Vector3
  pointerWorldDirection: Vector3 | undefined
  pointerWorldQuaternion: Quaternion
}

export type OnePointerHandleStoreData = {
  initialTargetPosition: Vector3
  initialTargetQuaternion: Quaternion
  initialTargetRotation: Euler
  initialTargetScale: Vector3
  initialTargetParentWorldMatrix: Matrix4 | undefined
}

export function computeOnePointerHandleTransformState(
  time: number,
  pointerData: OnePointerHandlePointerData,
  storeData: OnePointerHandleStoreData,
  targetParentWorldMatrix: Matrix4 | undefined,
  options: HandleOptions<any> & { translate?: HandleTransformOptions },
): HandleTransformState {
  //compute target parent world quaternion
  if (targetParentWorldMatrix == null) {
    quaternionHelper.identity()
  } else {
    targetParentWorldMatrix.decompose(vectorHelper1, quaternionHelper, vectorHelper2)
  }
  //compute space
  spaceHelper.length = 0
  addSpaceFromTransformOptions(
    spaceHelper,
    quaternionHelper,
    storeData.initialTargetRotation,
    options.translate ?? true,
    'translate',
  )
  //pointerWorldMatrix * pointerToTargetParentOffset = TargetParentWorldMatrix =>
  //initialPointerToTargetParentOffset = initialPointerWorldMatrix-1 * initialTargetParentWorldMatrix

  //same as: matrixHelper2.compose(vectorHelper1, pointerData.initialPointerWorldQuaternion, OneVector).invert()
  matrixHelper2
    .makeRotationFromQuaternion(quaternionHelper.copy(pointerData.initialPointerWorldQuaternion).invert())
    .multiply(matrixHelper1.makeTranslation(vectorHelper1.copy(pointerData.initialPointerWorldPoint).negate()))
  if (storeData.initialTargetParentWorldMatrix != null) {
    matrixHelper2.multiply(storeData.initialTargetParentWorldMatrix)
  }
  //matrixHelper2 = initialPointerToTargetParentOffset

  projectOntoSpace(
    spaceHelper,
    pointerData.initialPointerWorldPoint,
    vectorHelper1.copy(pointerData.pointerWorldPoint),
    pointerData.pointerWorldDirection,
  )
  matrixHelper1
    .compose(vectorHelper1, pointerData.pointerWorldQuaternion, OneVector)
    .multiply(matrixHelper2)
    .multiply(
      matrixHelper2.compose(
        storeData.initialTargetPosition,
        storeData.initialTargetQuaternion,
        storeData.initialTargetScale,
      ),
    )

  return computeHandleTransformState(time, 1, matrixHelper1, storeData, targetParentWorldMatrix, options)
}
