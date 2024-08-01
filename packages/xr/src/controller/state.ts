import { XRControllerGamepadState, updateXRControllerGamepadState } from './gamepad.js'
import { XRControllerLayoutLoader } from './layout.js'
import { XRControllerState } from '../input.js'

export async function createXRControllerState(
  inputSource: XRInputSource,
  layoutLoader: XRControllerLayoutLoader,
  events: ReadonlyArray<XRInputSourceEvent>,
): Promise<XRControllerState> {
  const layout = await layoutLoader.load(inputSource.profiles, inputSource.handedness)
  const gamepad: XRControllerGamepadState = {}
  updateXRControllerGamepadState(gamepad, inputSource, layout)
  return {
    events,
    type: 'controller',
    inputSource,
    gamepad,
    layout,
  }
}

export function updateXRControllerState({ gamepad, inputSource, layout }: XRControllerState) {
  updateXRControllerGamepadState(gamepad, inputSource, layout)
}
