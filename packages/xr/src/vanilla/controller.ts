import { Object3D } from 'three'
import { XRControllerLayout } from '../controller/layout.js'
import { XRControllerModelOptions, configureXRControllerModel, loadXRControllerModel } from '../controller/model.js'
import { createUpdateXRControllerVisuals } from '../controller/visual.js'
import { onXRFrame } from './utils.js'
import { XRControllerState } from '../input.js'

export class XRControllerModel extends Object3D {
  constructor(state: XRControllerState, options?: XRControllerModelOptions) {
    super()
    let update = () => {}
    onXRFrame(() => update())
    loadXRControllerModel(state.layout).then((model) => {
      this.add(model)
      state.object = model
      configureXRControllerModel(model, options)
      update = createUpdateXRControllerVisuals(model, state.layout, state.gamepad)
    })
  }
}
