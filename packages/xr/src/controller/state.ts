import { Object3D } from 'three'
import { XRControllerGamepadState, updateXRControllerGamepadState } from './gamepad.js'
import { XRControllerLayout, XRControllerLayoutLoader } from './layout.js'

export type XRControllerState = {
  type: 'controller'
  inputSource: XRInputSource
  gamepad: XRControllerGamepadState
  layout: XRControllerLayout
  object?: Object3D
}

export async function createXRControllerState(
  inputSource: XRInputSource,
  layoutLoader: XRControllerLayoutLoader,
): Promise<XRControllerState> {
  const layout = await layoutLoader.load(inputSource.profiles, inputSource.handedness)
  const gamepad: XRControllerGamepadState = {}
  updateXRControllerGamepadState(gamepad, inputSource, layout)
  return {
    type: 'controller',
    inputSource,
    gamepad,
    layout,
  }
}

export function updateXRControllerState({ gamepad, inputSource, layout }: XRControllerState) {
  updateXRControllerGamepadState(gamepad, inputSource, layout)
}
