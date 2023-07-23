import { Group, XRTargetRaySpace, XRGripSpace, XRHandSpace, Vector3, XRHandInputState, XRHandJoints } from 'three'
import { XRController } from '../XRController'
import { XRControllerEvent } from '../XREvents'
import { XRControllerModel } from '../XRControllerModelFactory'

export class XRTargetRaySpaceMock extends Group implements XRTargetRaySpace {
  readonly angularVelocity: Vector3 = new Vector3()
  hasAngularVelocity = false
  hasLinearVelocity = false
  readonly linearVelocity: Vector3 = new Vector3()
}

export class XRGripSpaceMock extends Group implements XRGripSpace {
  readonly angularVelocity: Vector3 = new Vector3()
  hasAngularVelocity = false
  hasLinearVelocity = false
  readonly linearVelocity: Vector3 = new Vector3()
}

export class XRHandSpaceMock extends Group implements XRHandSpace {
  readonly inputState: XRHandInputState = { pinching: false }
  readonly joints: Partial<XRHandJoints> = {}
}

export class XRControllerMock extends Group implements XRController {
  readonly controller: XRTargetRaySpace
  readonly grip: XRGripSpace
  readonly hand: XRHandSpace
  readonly index: number

  // TODO Implement mocks for inputSource
  // @ts-ignore
  inputSource: XRInputSource
  // TODO Implement mocks for xrControllerModel
  // @ts-ignore
  public xrControllerModel: XRControllerModel | null

  constructor(index: number) {
    super()
    this.index = index
    this.controller = new XRTargetRaySpaceMock()
    this.grip = new XRGripSpaceMock()
    this.hand = new XRHandSpaceMock()
  }

  _onConnected(_event: XRControllerEvent): void {
    throw new Error('Method not implemented.')
  }

  _onDisconnected(_event: XRControllerEvent): void {
    throw new Error('Method not implemented.')
  }

  dispose(): void {}
}