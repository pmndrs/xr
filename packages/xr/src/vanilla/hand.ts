import { Object3D } from 'three'
import { XRHandModelOptions, configureXRHandModel, createUpdateXRHandVisuals, loadXRHandModel } from '../hand/index.js'
import { onXRFrame } from './utils.js'
import { getSpaceFromAncestors } from '../space.js'
import { XRHandState } from '../input.js'

export class XRHandModel extends Object3D {
  constructor(state: XRHandState, options?: XRHandModelOptions) {
    super()
    let update: (frame: XRFrame) => void = () => {}
    onXRFrame((frame) => update(frame))
    loadXRHandModel(state.assetPath).then((model) => {
      this.add(model)
      state.object = model
      configureXRHandModel(model, options)
      update = createUpdateXRHandVisuals(state.inputSource.hand, model, () => getSpaceFromAncestors(this))
    })
  }
}
