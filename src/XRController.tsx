import * as THREE from 'three'
import { XRControllerEvent } from './XREvents'

export class XRController extends THREE.Group {
  readonly index: number
  readonly controller: THREE.XRTargetRaySpace
  readonly grip: THREE.XRGripSpace
  readonly hand: THREE.XRHandSpace
  inputSource!: XRInputSource

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

    this.onConnected = this.onConnected.bind(this)
    this.onDisconnected = this.onDisconnected.bind(this)

    this.controller.addEventListener('connected', this.onConnected)
    this.controller.addEventListener('disconnected', this.onDisconnected)
  }

  onConnected(event: XRControllerEvent) {
    if (event.fake) return

    this.visible = true
    this.inputSource = event.data!
    this.dispatchEvent(event)
  }

  onDisconnected(event: XRControllerEvent) {
    if (event.fake) return

    this.visible = false
    this.dispatchEvent(event)
  }

  dispose() {
    this.controller.removeEventListener('connected', this.onConnected)
    this.controller.removeEventListener('disconnected', this.onDisconnected)
  }
}
