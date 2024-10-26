import { Euler, Matrix4, Quaternion, Vector3 } from 'three'
import {
  computeOnePointerHandleTransformState,
  PointerData as PointerDataForOnePointerInteraction,
} from './one-pointer.js'
import { HandleOptions } from '../store.js'
import { computeTranslateAsHandleTransformState } from './translate-as.js'
import { computeTwoPointerHandleTransformState } from './two-pointer.js'

export type PointerData = PointerDataForOnePointerInteraction

export function computeHandleTransformState(
  time: number,
  inputState: Map<number, PointerData>,
  initialTargetPosition: Vector3,
  initialTargetQuaternion: Quaternion,
  initialTargetRotation: Euler,
  initialTargetScale: Vector3,
  targetParentWorldMatrix: Matrix4 | undefined,
  options: HandleOptions,
) {
  if (
    options.translate === 'as-rotate' ||
    options.translate === 'as-rotate-and-scale' ||
    options.translate === 'as-scale'
  ) {
    const [input] = inputState.values()
    return computeTranslateAsHandleTransformState()
  }
  if (inputState.size === 1) {
    const [input] = inputState.values()
    return computeOnePointerHandleTransformState(
      time,
      input,
      initialTargetPosition,
      initialTargetQuaternion,
      initialTargetRotation,
      initialTargetScale,
      targetParentWorldMatrix,
      options,
    )
  }
  return computeTwoPointerHandleTransformState()
}
