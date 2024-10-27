import { Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { Axis, HandleTransformState } from '../state.js'
import { HandleOptions, HandleTransformOptions } from '../store.js'
import { computeHandleTransformState } from './utils.js'
import { getSpaceFromOptions, projectOntoSpace } from '../utils.js'

const matrixHelper1 = new Matrix4()
const matrixHelper2 = new Matrix4()
const vectorHelper = new Vector3()
const quaternionHelper = new Quaternion()

const OneVector = new Vector3(1, 1, 1)
const spaceHelper = new Set<Axis>()

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
  spaceHelper.clear()
  getSpaceFromOptions(spaceHelper, options, 1)
  projectOntoSpace(
    spaceHelper,
    pointerData.initialPointerWorldPoint,
    vectorHelper.copy(pointerData.initialPointerWorldPoint),
    pointerData.initialPointerWorldDirection,
  )
  //pointerWorldMatrix * pointerToTargetParentOffset = TargetParentWorldMatrix =>
  //initialPointerToTargetParentOffset = initialPointerWorldMatrix-1 * initialTargetParentWorldMatrix

  //same as: matrixHelper2.compose(vectorHelper, pointerData.initialPointerWorldQuaternion, OneVector).invert()
  matrixHelper2
    .makeRotationFromQuaternion(quaternionHelper.copy(pointerData.initialPointerWorldQuaternion).invert())
    .multiply(matrixHelper1.makeTranslation(vectorHelper.negate()))
  if (storeData.initialTargetParentWorldMatrix != null) {
    matrixHelper2.multiply(storeData.initialTargetParentWorldMatrix)
  }
  //matrixHelper2 = initialPointerToTargetParentOffset

  projectOntoSpace(
    spaceHelper,
    pointerData.initialPointerWorldPoint,
    vectorHelper.copy(pointerData.pointerWorldPoint),
    pointerData.pointerWorldDirection,
  )
  matrixHelper1
    .compose(vectorHelper, pointerData.pointerWorldQuaternion, OneVector)
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
