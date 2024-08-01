import { Object3D } from 'three'
import { createGetXRSpaceMatrix, getSpaceFromAncestors } from '../space.js'
import { onXRFrame } from './utils.js'
import { XRSpaceType } from './types.js'

export class XRSpace extends Object3D {
  constructor(
    public readonly xrSpace: XRSpaceType,
    origin?: Object3D,
    originReferenceSpace?: XRReferenceSpace,
  ) {
    super()
    const getSpaceMatrix = createGetXRSpaceMatrix(xrSpace, () =>
      getSpaceFromAncestors(this, origin, originReferenceSpace),
    )
    this.matrixAutoUpdate = false
    this.visible = false
    onXRFrame((frame) => {
      if (frame == null) {
        return
      }
      getSpaceMatrix(this.matrix, frame)
      this.visible = true
    })
  }
}
