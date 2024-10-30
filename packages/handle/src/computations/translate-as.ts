import { Matrix4, Quaternion, Vector3 } from 'three'
import { HandleTransformState } from '../state.js'
import { HandleOptions } from '../store.js'
import {
  addSpaceFromTransformOptions,
  BaseHandleStoreData,
  computeHandleTransformState,
  projectOntoSpace,
} from './utils.js'

const vectorHelper1 = new Vector3()
const vectorHelper2 = new Vector3()
const vectorHelper3 = new Vector3()

const deltaHelper1 = new Vector3()
const deltaHelper2 = new Vector3()

const qHelper1 = new Quaternion()
const quaterionHelper2 = new Quaternion()

const matrixHelper = new Matrix4()

const scaleHelper = new Vector3()

const space: Array<Vector3> = []

export type TranslateAsHandlePointerData = {
  pointerWorldPoint: Vector3
  pointerWorldDirection: Vector3 | undefined
  pointerWorldQuaternion: Quaternion
  prevPointerWorldQuaternion: Quaternion
  initialPointerWorldPoint: Vector3
  initialPointerWorldDirection: Vector3 | undefined
}

export type TranslateAsHandleStoreData = {
  initialTargetPosition: Vector3
  initialTargetQuaternion: Quaternion
  initialTargetScale: Vector3
  initialTargetParentWorldMatrix: Matrix4 | undefined
  prevTranslateAsDeltaRotation: Quaternion | undefined
} & BaseHandleStoreData

export function computeTranslateAsHandleTransformState(
  time: number,
  pointerData: TranslateAsHandlePointerData,
  storeData: TranslateAsHandleStoreData,
  targetWorldMatrix: Matrix4,
  targetParentWorldMatrix: Matrix4 | undefined,
  options: HandleOptions<any> & { translate?: 'as-rotate' | 'as-scale' | 'as-rotate-and-scale' },
): HandleTransformState {
  //compute target parent world quaternion
  if (targetParentWorldMatrix == null) {
    qHelper1.identity()
  } else {
    targetParentWorldMatrix.decompose(vectorHelper1, qHelper1, vectorHelper2)
  }
  //compute space
  space.length = 0
  if (options.translate != 'as-rotate') {
    addSpaceFromTransformOptions(space, qHelper1, storeData.initialTargetRotation, options.scale ?? true, 'scale')
  }
  if (options.translate != 'as-scale') {
    addSpaceFromTransformOptions(space, qHelper1, storeData.initialTargetRotation, options.rotate ?? true, 'rotate')
  }
  //project into sapce
  projectOntoSpace(
    space,
    pointerData.initialPointerWorldPoint,
    vectorHelper1.copy(pointerData.initialPointerWorldPoint),
    pointerData.initialPointerWorldDirection,
  )

  console.log(
    'y',
    ...space.map((x) => x.toArray()),
    'x',
    ...(pointerData.initialPointerWorldDirection?.toArray() ?? []),
    'z',
    pointerData.initialPointerWorldPoint.toArray(),
    '/',
    vectorHelper1.toArray(),
  )
  projectOntoSpace(
    space,
    pointerData.initialPointerWorldPoint,
    vectorHelper2.copy(pointerData.pointerWorldPoint),
    pointerData.pointerWorldDirection,
  )

  matrixHelper.makeTranslation(storeData.initialTargetPosition)
  if (storeData.initialTargetParentWorldMatrix != null) {
    matrixHelper.premultiply(storeData.initialTargetParentWorldMatrix)
  }
  deltaHelper1.setFromMatrixPosition(matrixHelper).negate().add(vectorHelper1)
  deltaHelper2.setFromMatrixPosition(targetWorldMatrix).negate().add(vectorHelper2)

  console.log(deltaHelper1.toArray(), '/', deltaHelper2.toArray())

  //compute delta rotation
  if (options.translate === 'as-scale') {
    qHelper1.copy(storeData.initialTargetQuaternion)
  } else {
    vectorHelper1.copy(deltaHelper1)
    if (storeData.prevTranslateAsDeltaRotation != null) {
      vectorHelper1.applyQuaternion(storeData.prevTranslateAsDeltaRotation)
    }
    vectorHelper1.normalize()
    vectorHelper2.copy(deltaHelper2).normalize()
    qHelper1.setFromUnitVectors(vectorHelper1, vectorHelper2)
    if (storeData.prevTranslateAsDeltaRotation == null) {
      storeData.prevTranslateAsDeltaRotation = new Quaternion()
    } else {
      qHelper1.multiply(storeData.prevTranslateAsDeltaRotation)
    }
    storeData.prevTranslateAsDeltaRotation.copy(qHelper1)
    qHelper1.multiply(storeData.initialTargetQuaternion)
  }

  //compute delta scale
  if (options.translate === 'as-rotate') {
    scaleHelper.set(1, 1, 1)
  } else if (typeof options.scale === 'object' && (options.scale.uniform ?? false)) {
    scaleHelper.setScalar(deltaHelper2.length() / deltaHelper1.length())
  } else if (options.translate === 'as-rotate-and-scale') {
    //compute the initial world quaternion and initial world scale
    matrixHelper.compose(
      storeData.initialTargetPosition,
      storeData.initialTargetQuaternion,
      storeData.initialTargetScale,
    )
    if (storeData.initialTargetParentWorldMatrix != null) {
      matrixHelper.premultiply(storeData.initialTargetParentWorldMatrix)
    }
    matrixHelper.decompose(vectorHelper2, quaterionHelper2, vectorHelper3)
    //compute the initial scale axis
    vectorHelper1.copy(deltaHelper1).applyQuaternion(quaterionHelper2.invert()).divide(vectorHelper3)
    vectorHelper1.x = Math.abs(vectorHelper1.x)
    vectorHelper1.y = Math.abs(vectorHelper1.y)
    vectorHelper1.z = Math.abs(vectorHelper1.z)
    const maxCompInitialDelta = Math.max(...vectorHelper1.toArray())
    vectorHelper1.divideScalar(maxCompInitialDelta)
    scaleHelper.set(1, 1, 1)
    scaleHelper.addScaledVector(vectorHelper1, deltaHelper2.length() / deltaHelper1.length() - 1)
  } else {
    //as scale
    if (storeData.initialTargetParentWorldMatrix != null) {
      storeData.initialTargetParentWorldMatrix.decompose(vectorHelper1, quaterionHelper2, vectorHelper2)
      quaterionHelper2.multiply(storeData.initialTargetQuaternion)
    } else {
      quaterionHelper2.copy(storeData.initialTargetQuaternion)
    }
    vectorHelper1.copy(deltaHelper1).applyQuaternion(quaterionHelper2.invert())

    if (targetParentWorldMatrix != null) {
      targetParentWorldMatrix.decompose(vectorHelper2, quaterionHelper2, vectorHelper3)
      quaterionHelper2.multiply(storeData.initialTargetQuaternion)
    } else {
      quaterionHelper2.copy(storeData.initialTargetQuaternion)
    }
    vectorHelper2.copy(deltaHelper2).applyQuaternion(quaterionHelper2.invert())
    console.log('!', vectorHelper1.toArray(), '->', vectorHelper2.toArray())

    scaleHelper.x = vectorHelper1.x === 0 ? 1 : Math.abs(vectorHelper2.x / vectorHelper1.x)
    scaleHelper.y = vectorHelper1.y === 0 ? 1 : Math.abs(vectorHelper2.y / vectorHelper1.y)
    scaleHelper.z = vectorHelper1.z === 0 ? 1 : Math.abs(vectorHelper2.z / vectorHelper1.z)
  }

  matrixHelper.compose(storeData.initialTargetPosition, qHelper1, scaleHelper)

  //we pass targetParentWorldMatrix as undefined, because we calculated matrixHelper1 in local target space
  return computeHandleTransformState(time, 1, matrixHelper, storeData, undefined, options)
}
