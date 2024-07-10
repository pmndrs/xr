import { Object3D } from 'three'
import { GetXRSpace, createGetXRSpaceMatrix } from '../space.js'
import { onXRFrame, setupConsumeReferenceSpace, setupProvideReferenceSpace } from './utils.js'

export class XRSpace extends Object3D {
  constructor(public readonly space: GetXRSpace) {
    super()
    setupProvideReferenceSpace(this, space)
    const referenceSpace = setupConsumeReferenceSpace(this)
    const getSpaceMatrix = createGetXRSpaceMatrix(space, referenceSpace)
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
