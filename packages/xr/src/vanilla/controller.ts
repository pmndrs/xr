import { Object3D } from 'three'
import { XRControllerLayout } from '../controller/layout.js'
import { XRControllerModelOptions, configureXRControllerModel, loadXRControllerModel } from '../controller/model.js'
import { createUpdateXRControllerVisuals } from '../controller/visual.js'
import { XRControllerGamepadState } from '../controller/gamepad.js'
import { onXRFrame } from './utils.js'

export class XRControllerModel extends Object3D {
  constructor(layout: XRControllerLayout, gamepadState: XRControllerGamepadState, options?: XRControllerModelOptions) {
    super()
    let update = () => {}
    onXRFrame(() => update())
    loadXRControllerModel(layout).then((model) => {
      this.add(model)
      configureXRControllerModel(model, options)
      update = createUpdateXRControllerVisuals(model, layout, gamepadState)
    })
  }
}
