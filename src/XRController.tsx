import * as THREE from 'three'
import { XRControllerEvent } from './XREvents'
import {XRControllerModel, XRControllerModelFactory} from "./XRControllerModelFactory";


export class ControllerModel extends THREE.Group {
  readonly target: XRController
  readonly xrControllerModel: XRControllerModel
  private modelFactory: XRControllerModelFactory;

  constructor(target: XRController, modelFactory: XRControllerModelFactory) {
    super()
    this.xrControllerModel = new XRControllerModel()
    this.target = target
    this.modelFactory = modelFactory
    this.add(this.xrControllerModel)

    this._onConnected = this._onConnected.bind(this)
    this._onDisconnected = this._onDisconnected.bind(this)

    this.target.controller.addEventListener('connected', this._onConnected)
    this.target.controller.addEventListener('disconnected', this._onDisconnected)
  }

  private _onConnected(event: XRControllerEvent) {
    this.modelFactory.initializeControllerModel(this.xrControllerModel, event)
  }

  private _onDisconnected(_event: XRControllerEvent) {
    this.xrControllerModel.disconnect()
  }

  dispose() {
    this.target.controller.removeEventListener('connected', this._onConnected)
    this.target.controller.removeEventListener('disconnected', this._onDisconnected)
  }
}

export class XRController extends THREE.Group {
  readonly index: number
  readonly controller: THREE.XRTargetRaySpace
  readonly grip: THREE.XRGripSpace
  readonly hand: THREE.XRHandSpace
  public inputSource!: XRInputSource
  public controllerModel: ControllerModel | null = null;

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

    this.visible = true
    this.inputSource = event.data!
    this.dispatchEvent(event)
  }

  _onDisconnected(event: XRControllerEvent) {
    if (event.fake) return

    this.visible = false
    this.dispatchEvent(event)
  }

  dispose() {
    this.controller.removeEventListener('connected', this._onConnected)
    this.controller.removeEventListener('disconnected', this._onDisconnected)
  }
}
