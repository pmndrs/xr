import {
  XRTargetRaySpace,
  XRGripSpace,
  XRHandSpace,
  WebXRManager,
  PerspectiveCamera,
  WebXRArrayCamera,
  EventDispatcher
} from 'three'
import { vi } from 'vitest'
import { XRTargetRaySpaceMock, XRGripSpaceMock, XRHandSpaceMock } from './XRSpaceMock'

export class WebXRManagerMock extends EventDispatcher implements WebXRManager {
  // @ts-ignore
  enabled: boolean
  // @ts-ignore
  isPresenting: boolean
  // @ts-ignore
  cameraAutoUpdate: boolean
  setFramebufferScaleFactor(_value: number): void {
    throw new Error('Method not implemented.')
  }
  setReferenceSpaceType(_value: XRReferenceSpaceType): void {
    throw new Error('Method not implemented.')
  }
  getReferenceSpace(): XRReferenceSpace | null {
    throw new Error('Method not implemented.')
  }
  setReferenceSpace(_value: XRReferenceSpace): void {
    throw new Error('Method not implemented.')
  }
  getBaseLayer(): XRWebGLLayer | XRProjectionLayer {
    throw new Error('Method not implemented.')
  }
  getBinding(): XRWebGLBinding {
    throw new Error('Method not implemented.')
  }
  getFrame(): XRFrame {
    throw new Error('Method not implemented.')
  }
  getSession(): XRSession | null {
    throw new Error('Method not implemented.')
  }
  setSession(_value: XRSession): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getCamera(): WebXRArrayCamera {
    throw new Error('Method not implemented.')
  }
  updateCamera(_camera: PerspectiveCamera): void {
    throw new Error('Method not implemented.')
  }
  setAnimationLoop(_callback: XRFrameRequestCallback | null): void {
    throw new Error('Method not implemented.')
  }
  getFoveation(): number | undefined {
    throw new Error('Method not implemented.')
  }
  setFoveation(_foveation: number): void {
    throw new Error('Method not implemented.')
  }
  dispose(): void {
    throw new Error('Method not implemented.')
  }
  getController = vi.fn<[index: number], XRTargetRaySpace>().mockImplementation(() => new XRTargetRaySpaceMock())
  getControllerGrip = vi.fn<[index: number], XRGripSpace>().mockImplementation(() => new XRGripSpaceMock())
  getHand = vi.fn<[index: number], XRHandSpace>().mockImplementation(() => new XRHandSpaceMock())
}
