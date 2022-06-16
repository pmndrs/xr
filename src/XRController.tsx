import * as THREE from 'three'

export class XRController extends THREE.Group {
  public inputSource!: XRInputSource
  /** Group with orientation of the preferred pointing ray */
  readonly controller: THREE.XRTargetRaySpace
  /**
   * Group with orientation that should be used to render virtual
   * objects such that they appear to be held in the user’s hand
   */
  readonly grip: THREE.XRGripSpace
  /** Group with hand */
  readonly hand: THREE.XRHandSpace

  constructor(id: number, gl: THREE.WebGLRenderer) {
    super()

    this.controller = gl.xr.getController(id)
    this.grip = gl.xr.getControllerGrip(id)
    this.hand = gl.xr.getHand(id)

    this.grip.userData.name = 'grip'
    this.controller.userData.name = 'controller'
    this.hand.userData.name = 'hand'

    this.controller.addEventListener('connected', this.onConnected)
    this.controller.addEventListener('disconnected', this.onDisconnected)
  }

  onConnected(event: any) {
    if (!event.fake) this.inputSource = event.data

    this.visible = true
    this.dispatchEvent(event)
  }

  onDisconnected(event: any) {
    this.visible = false
    this.dispatchEvent(event)
  }

  dispose() {
    this.controller.removeEventListener('connected', this.onConnected)
    this.controller.removeEventListener('disconnected', this.onDisconnected)
  }
}
