import { XRSpaceMock } from './XRSpaceMock'

export class XRInputSourceMock implements XRInputSource {
  constructor(handedness: XRHandedness = 'left', targetRayMode: XRTargetRayMode = 'tracked-pointer', profiles = ['oculus-touch-v3']) {
    this.handedness = handedness
    this.targetRayMode = targetRayMode
    this.targetRaySpace = new XRSpaceMock()
    this.profiles = profiles
  }
  handedness: XRHandedness
  targetRayMode: XRTargetRayMode
  targetRaySpace: XRSpace
  gripSpace?: XRSpace | undefined
  gamepad?: Gamepad | undefined
  profiles: string[]
  hand?: XRHand | undefined
}
