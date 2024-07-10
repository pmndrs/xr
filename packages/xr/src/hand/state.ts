import { Object3D, WebXRManager } from 'three'
import { XRHandPoseState, createHandPoseState, updateXRHandPoseState } from './pose.js'
import { XRHandLoaderOptions, getXRHandAssetPath } from './model.js'

export type XRHandInputSource = XRInputSource & { hand: XRHand }

export function isXRHandInputSource(inputSource: XRInputSource): inputSource is XRHandInputSource {
  return inputSource.hand != null
}

export type XRHandState = {
  type: 'hand'
  inputSource: XRHandInputSource
  pose: XRHandPoseState
  assetPath: string
  object?: Object3D
}

export function createXRHandState(inputSource: XRInputSource, options: XRHandLoaderOptions | undefined): XRHandState {
  return {
    type: 'hand',
    inputSource: inputSource as XRHandInputSource,
    pose: createHandPoseState(inputSource.hand!),
    assetPath: getXRHandAssetPath(inputSource.handedness, options),
  }
}

export function updateXRHandState(
  { inputSource, pose }: XRHandState,
  frame: XRFrame | undefined,
  manager: WebXRManager,
): void {
  updateXRHandPoseState(pose, frame, inputSource.hand, manager, inputSource.handedness)
}
