import { Mesh } from 'three'
import { updateXRPlaneGeometry } from '../plane.js'

export class XRPlaneModel extends Mesh {
  constructor(plane: XRPlane) {
    super(updateXRPlaneGeometry(plane, undefined))
    this.onBeforeRender = () => {
      const newGeometry = updateXRPlaneGeometry(plane, this.geometry)
      if (newGeometry != this.geometry) {
        this.geometry.dispose()
      }
      this.geometry = newGeometry
    }
  }
}
