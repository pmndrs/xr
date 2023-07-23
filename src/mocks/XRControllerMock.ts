import { Group, XRTargetRaySpace, XRGripSpace, XRHandSpace } from 'three'
import { XRController } from '../XRController'
import { XRControllerEvent } from '../XREvents'
import { XRControllerModel } from '../XRControllerModel'
import { XRTargetRaySpaceMock, XRGripSpaceMock, XRHandSpaceMock } from './XRSpaceMock'
import { XRInputSourceMock } from './XRInputSourceMock'

export class XRControllerMock extends Group implements XRController {
  readonly controller: XRTargetRaySpace
  readonly grip: XRGripSpace
  readonly hand: XRHandSpace
  readonly index: number

  inputSource: XRInputSource | null = null
  public xrControllerModel: XRControllerModel | null = null

  constructor(index: number) {
    super()
    this.index = index
    this.controller = new XRTargetRaySpaceMock()
    this.grip = new XRGripSpaceMock()
    this.hand = new XRHandSpaceMock()
    this.inputSource = new XRInputSourceMock()
  }

  _onConnected(_event: XRControllerEvent): void {
    throw new Error('Method not implemented.')
  }

  _onDisconnected(_event: XRControllerEvent): void {
    throw new Error('Method not implemented.')
  }

  dispose(): void {}
}
