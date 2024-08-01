import { Object3D } from 'three'
import { XRHandModelOptions, configureXRHandModel, createUpdateXRHandVisuals, loadXRHandModel } from '../hand/index.js'
import { onXRFrame } from './utils.js'
import { getSpaceFromAncestors } from '../space.js'

export class XRHandModel extends Object3D {
  constructor(hand: XRHand, assetPath: string, options?: XRHandModelOptions) {
    super()
    let update: (frame: XRFrame) => void = () => {}
    onXRFrame((frame) => update(frame))
    loadXRHandModel(assetPath).then((model) => {
      this.add(model)
      configureXRHandModel(model, options)
      update = createUpdateXRHandVisuals(hand, model, () => getSpaceFromAncestors(this))
    })
  }
}
