import { XRSpaceMock } from './XRSpaceMock'

export class GamepadMock implements Gamepad {
  // @ts-ignore
  axes: readonly number[]
  // @ts-ignore
  buttons: readonly GamepadButton[]
  // @ts-ignore
  connected: boolean
  // @ts-ignore
  hapticActuators: readonly GamepadHapticActuator[]
  // @ts-ignore
  id: string
  // @ts-ignore
  index: number
  // @ts-ignore
  mapping: GamepadMappingType
  // @ts-ignore
  timestamp: number
  // @ts-ignore
  vibrationActuator: GamepadHapticActuator | null
}

export class XRInputSourceMock implements XRInputSource {
  constructor({
    handedness = 'left',
    targetRayMode = 'tracked-pointer',
    profiles = ['oculus-touch-v3']
  }: {
    handedness?: XRHandedness
    targetRayMode?: XRTargetRayMode
    profiles?: string[]
  } = {}) {
    this.handedness = handedness
    this.targetRayMode = targetRayMode
    this.targetRaySpace = new XRSpaceMock()
    this.profiles = profiles
    this.gamepad = new GamepadMock()
  }

  handedness: XRHandedness
  targetRayMode: XRTargetRayMode
  targetRaySpace: XRSpace
  gripSpace?: XRSpace | undefined
  gamepad?: Gamepad | undefined
  profiles: string[]
  hand?: XRHand | undefined
}
