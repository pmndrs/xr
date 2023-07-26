import { Group, XRTargetRaySpace, Vector3, XRGripSpace, XRHandSpace, XRHandInputState, XRHandJoints } from 'three'

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

export class XRSpaceMock extends EventTarget implements XRSpace {}
