import { WebGLRenderer, Group, Object3D } from 'three'
import { XRInputSource } from './webxr'

export interface XRController {
  inputSource?: XRInputSource
  /**
   * Group with orientation that should be used to render virtual
   * objects such that they appear to be held in the user’s hand
   */
  grip: Group
  /** Group with orientation of the preferred pointing ray */
  controller: Group
  hovering: Set<Object3D>
  hoverRayLength?: number
}
export const XRController = {
  make: (id: number, gl: WebGLRenderer): XRController => {
    const controller = gl.xr.getController(id)
    const grip = gl.xr.getControllerGrip(id)
    const xrController = {
      inputSource: undefined,
      grip,
      controller,
      hovering: new Set<Object3D>(),
      selecting: new Set<Object3D>()
    }
    grip.userData.name = 'grip'
    controller.userData.name = 'controller'

    return xrController
  }
}
