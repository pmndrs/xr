import * as THREE from 'three'
import { XRControllerEvent } from './XREvents'
import { XRControllerModel } from './XRControllerModel'

/** Counterpart of WebXRController from three js
 * in a sense that it's long living */
export class XRController extends THREE.Group {
  readonly index: number
  readonly controller: THREE.XRTargetRaySpace
  readonly grip: THREE.XRGripSpace
  readonly hand: THREE.XRHandSpace
  public inputSource: XRInputSource | null = null
  public xrControllerModel: XRControllerModel | null = null

  constructor(index: number, gl: THREE.WebGLRenderer) {
    super()

    this.index = index
    this.controller = gl.xr.getController(index)
    this.grip = gl.xr.getControllerGrip(index)
    this.hand = gl.xr.getHand(index)

    this.grip.userData.name = 'grip'
    this.controller.userData.name = 'controller'
    this.hand.userData.name = 'hand'

    this.visible = false
    this.add(this.controller, this.grip, this.hand)

    this._onConnected = this._onConnected.bind(this)
    this._onDisconnected = this._onDisconnected.bind(this)

    this.controller.addEventListener('connected', this._onConnected)
    this.controller.addEventListener('disconnected', this._onDisconnected)
  }

  _onConnected(event: XRControllerEvent) {
    if (event.fake) return
    if (!event.data) return

    this.visible = true
    this.inputSource = event.data
    this.dispatchEvent(event)
  }

  _onDisconnected(event: XRControllerEvent) {
    if (event.fake) return

    this.visible = false
    this.inputSource = null
    this.dispatchEvent(event)
  }

  dispose() {
    this.controller.removeEventListener('connected', this._onConnected)
    this.controller.removeEventListener('disconnected', this._onDisconnected)
  }
}
