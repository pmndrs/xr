import { WebGLRenderer, Group, XRInputSource } from 'three'

export interface XRController {
  inputSource: XRInputSource
  /**
   * Group with orientation that should be used to render virtual
   * objects such that they appear to be held in the user’s hand
   */
  grip: Group
  /** Group with orientation of the preferred pointing ray */
  controller: Group
  /** Group with hand */
  hand: Group
}
export const XRController = {
  make: (id: number, gl: WebGLRenderer, onConnected: (c: XRController) => any, onDisconnected: (c: XRController) => any) => {
    const controller = gl.xr.getController(id)
    const grip = gl.xr.getControllerGrip(id)
    const hand = gl.xr.getHand(id)

    const xrController: XRController = {
      inputSource: undefined as any,
      grip,
      controller,
      hand
    }
    grip.userData.name = 'grip'
    controller.userData.name = 'controller'
    hand.userData.name = 'hand'

    controller.addEventListener('connected', (event) => {
      if (event.fake) {
        return
      }
      xrController.inputSource = event.data
      onConnected(xrController)
    })

    controller.addEventListener('disconnected', (_) => {
      onDisconnected(xrController)
    })
  }
}
