import { Object3D } from 'three'
import { clamp } from 'three/src/math/MathUtils.js'
import type { XRControllerLayout } from './layout.js'

export type XRControllerGamepadComponentId =
  | `a-button`
  | `b-button`
  | `x-button`
  | `y-button`
  | `xr-standard-squeeze`
  | `xr-standard-thumbstick`
  | `xr-standard-trigger`
  | `thumbrest`
  | (string & {})

export type XRControllerGamepadComponentState = {
  state: 'default' | 'touched' | 'pressed'
  button?: number
  xAxis?: number
  yAxis?: number
  object?: Object3D
}

const ButtonTouchThreshold = 0.05
const AxisTouchThreshold = 0.1

export type XRControllerGamepadState = Record<string, XRControllerGamepadComponentState | undefined>

export function updateXRControllerGamepadState(
  target: XRControllerGamepadState,
  inputSource: XRInputSource,
  layout: XRControllerLayout,
) {
  const gamepad = inputSource.gamepad
  if (gamepad == null) {
    return
  }
  const layoutComponents = layout.components
  for (const key in layoutComponents) {
    let component = target[key]
    if (component == null) {
      target[key] = component = {} as XRControllerGamepadComponentState
    }
    const { gamepadIndices } = layoutComponents[key]
    let pressed = false
    let touched = false
    if (gamepadIndices.button != null && gamepadIndices.button < gamepad.buttons.length) {
      const gamepadButton = gamepad.buttons[gamepadIndices.button]
      component.button = clamp(gamepadButton.value, 0, 1)
      pressed ||= gamepadButton.pressed || component.button === 1
      touched ||= gamepadButton.touched || component.button > ButtonTouchThreshold
    }
    if (gamepadIndices.xAxis != null && gamepadIndices.xAxis < gamepad.axes.length) {
      component.xAxis = clamp(gamepad.axes[gamepadIndices.xAxis], -1, 1)
      touched ||= Math.abs(component.xAxis) > AxisTouchThreshold
    }
    if (gamepadIndices.yAxis != null && gamepadIndices.yAxis < gamepad.axes.length) {
      component.yAxis = clamp(gamepad.axes[gamepadIndices.yAxis], -1, 1)
      touched ||= Math.abs(component.yAxis) > AxisTouchThreshold
    }
    component.state = pressed ? 'pressed' : touched ? 'touched' : 'default'
  }
}
