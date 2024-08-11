import { XRControllerGamepadState, updateXRControllerGamepadState } from './gamepad.js'
import { XRControllerLayoutLoader } from './layout.js'
import { XRControllerState } from '../input.js'
import { syncAsync } from './utils.js'

export function createXRControllerState(
  id: string,
  inputSource: XRInputSource,
  layoutLoader: XRControllerLayoutLoader,
  events: ReadonlyArray<XRInputSourceEvent>,
  isPrimary: boolean,
): Promise<XRControllerState> | XRControllerState {
  return syncAsync(
    () => layoutLoader.load(inputSource.profiles, inputSource.handedness),
    (layout) => {
      const gamepad: XRControllerGamepadState = {}
      updateXRControllerGamepadState(gamepad, inputSource, layout)
      return {
        id,
        isPrimary,
        events,
        type: 'controller',
        inputSource,
        gamepad,
        layout,
      }
    },
  )
}

export function updateXRControllerState({ gamepad, inputSource, layout }: XRControllerState) {
  updateXRControllerGamepadState(gamepad, inputSource, layout)
}
