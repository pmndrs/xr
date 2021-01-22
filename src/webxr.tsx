// Types that should eventually land in lib.dom.d.ts
// Taken from WebXR spec
// https://www.w3.org/TR/webxr/
// https://immersive-web.github.io/hit-test/#hit-test-source-interface

export type XRHandedness = 'none' | 'left' | 'right'

export type XRTargetRayMode = 'gaze' | 'tracked-pointer' | 'screen'

export type XRSpace = EventTarget

export type XRReferenceSpace = XRSpace

export type FrozenArray<T> = Array<T>

export interface XRHitTestSource {
  cancel(): void
}

export interface XRFrame {
  getHitTestResults(hitTestSource: XRHitTestSource): FrozenArray<XRHitTestResult>
}

export interface XRHitTestResult {
  getPose(baseSpace: XRSpace): XRPose
}

export interface XRPose {
  readonly transform: XRRigidTransform
  readonly emulatedPosition: boolean
}

export interface XRRigidTransform {
  readonly position: DOMPointReadOnly
  readonly orientation: DOMPointReadOnly
  readonly matrix: Float32Array
  readonly inverse: XRRigidTransform
}

export interface XRInputSource {
  readonly handedness: XRHandedness
  readonly targetRayMode: XRTargetRayMode
  readonly gamepad?: Gamepad
  readonly targetRaySpace: XRSpace
  readonly gripSpace?: XRSpace
  readonly profiles: string
}
